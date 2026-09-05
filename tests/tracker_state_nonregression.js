const assert=require('assert');
const S=require('../tracker_state_v1');
const state=S.createSnapshot({analysisId:'a1',teamId:'cay-senior',videoFingerprint:'vid-abc',savedAt:'2026-08-27T09:00:00Z',tracks:[{trackId:7,playerId:'p7',team:'CAY',observations:18,identityConfidence:.91,segments:['s1','s1','s2'],appearance:[.1,.2,.3]}],calibrationSegments:[{id:'s1',valid:true}],coverage:{identity:.88,metric:.74}});
assert.equal(state.schema,'CAY_TRACKER_STATE');
assert.equal(state.tracks.length,1);
assert.deepEqual(state.tracks[0].segments,['s1','s2']);
assert.deepEqual(state.tracks[0].feature,[.1,.2,.3]);
assert.equal(S.validateSnapshot(state).valid,true);
assert.equal(S.canResume(state,{teamId:'cay-senior',videoFingerprint:'vid-abc'}).allowed,true);
assert.equal(S.canResume(state,{teamId:'other',videoFingerprint:'vid-abc'}).reason,'TEAM_MISMATCH');
assert.equal(S.canResume(state,{teamId:'cay-senior',videoFingerprint:'vid-other'}).reason,'VIDEO_MISMATCH');
assert.equal(S.canResume(state,{videoFingerprint:'vid-abc'}).reason,'CONTEXT_TEAM_REQUIRED');
assert.equal(S.canResume(state,{teamId:'cay-senior'}).reason,'CONTEXT_VIDEO_REQUIRED');
const stateWithoutTeam=S.createSnapshot({videoFingerprint:'vid-abc',tracks:[{trackId:'7'}]});
assert.equal(S.canResume(stateWithoutTeam,{teamId:'cay-senior',videoFingerprint:'vid-abc'}).reason,'STATE_TEAM_SCOPE_REQUIRED');
const stateWithoutVideo=S.createSnapshot({teamId:'cay-senior',tracks:[{trackId:'7'}]});
assert.equal(S.canResume(stateWithoutVideo,{teamId:'cay-senior',videoFingerprint:'vid-abc'}).reason,'STATE_VIDEO_SCOPE_REQUIRED');
const round=S.importJson(S.exportJson(state));
assert.equal(round.tracks[0].playerId,'p7');
assert.deepEqual(round.tracks[0].feature,[.1,.2,.3]);

// Direct compatibility with CAYTrackingCore track shape: globalId/seen/segmentsSeen/feature/appearanceGallery.
const runtimeTrack={globalId:12,playerId:'p12',team:'CAY',cat:'team',seen:31,identityConfidence:.94,segmentsSeen:[1,2],feature:[.11,.22,.33],appearanceGallery:[
  {feature:[.10,.21,.32],quality:.91},
  {feature:[.12,.23,.34],quality:.84}
],firstTime:1,lastTime:42,archived:true};
const persisted=S.createSnapshot({teamId:'cay-senior',videoFingerprint:'vid-runtime',tracks:[runtimeTrack]});
assert.equal(persisted.tracks[0].trackId,'12');
assert.equal(persisted.tracks[0].observations,31);
assert.deepEqual(persisted.tracks[0].segments,['1','2']);
assert.deepEqual(persisted.tracks[0].feature,[.11,.22,.33]);
assert.deepEqual(persisted.tracks[0].appearance,[.11,.22,.33]);
assert.equal(persisted.tracks[0].appearanceGallery.length,2);
assert.equal(persisted.tracks[0].appearanceGallery[0].quality,.91);
assert.equal(persisted.tracks[0].status,'ARCHIVED');
const runtimeRound=S.importJson(S.exportJson(persisted));
assert.deepEqual(runtimeRound.tracks[0].feature,[.11,.22,.33]);
assert.deepEqual(runtimeRound.tracks[0].appearanceGallery,persisted.tracks[0].appearanceGallery);

// Legacy v1 snapshots with only `appearance` are hydrated into runtime `feature` on import.
const legacy=JSON.parse(S.exportJson(state));
delete legacy.tracks[0].feature;
const legacyRound=S.importJson(JSON.stringify(legacy));
assert.deepEqual(legacyRound.tracks[0].feature,[.1,.2,.3]);

// Fail closed on malformed persisted ReID evidence instead of poisoning future identity association.
const badDimension=JSON.parse(S.exportJson(persisted));
badDimension.tracks[0].appearanceGallery[0].feature=[.1,.2];
assert.equal(S.validateSnapshot(badDimension).valid,false);
assert(S.validateSnapshot(badDimension).errors.includes('TRACK_GALLERY_DIMENSION_MISMATCH'));
const badQuality=JSON.parse(S.exportJson(persisted));
badQuality.tracks[0].appearanceGallery[0].quality=1.5;
assert(S.validateSnapshot(badQuality).errors.includes('TRACK_GALLERY_QUALITY_INVALID'));
assert.throws(()=>S.importJson(JSON.stringify(badDimension)),/TRACK_GALLERY_DIMENSION_MISMATCH/);

assert.throws(()=>S.createSnapshot({password:'clair'}),/SECRET_FIELD_FORBIDDEN/);
assert.throws(()=>S.createSnapshot({runtime:{token:'x'}}),/SECRET_FIELD_FORBIDDEN/);
assert.throws(()=>S.createSnapshot({tracks:[{trackId:'1'},{trackId:'1'}]}),/DUPLICATE_TRACK_ID/);
console.log('tracker state non-regression: PASS');
