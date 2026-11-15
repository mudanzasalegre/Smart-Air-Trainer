import {describe,it,expect} from 'vitest';
import 'fake-indexeddb/auto';
import {storage} from '../src/storage';
import {editorContent,routeEditor,hasEditorWork} from '../src/routes/editorDraft';
import {editPoints} from '../src/routes/editor';
import {buildElevation} from '../src/routes/elevation';
import {defaultSimulation,type StoredRoute} from '../src/routes/types';
import {RouteSimulationEngine} from '../src/routes/simulation';
const geometry=[{lat:39.68,lon:-.27,ele:50},{lat:39.681,lon:-.27,ele:52},{lat:39.682,lon:-.27,ele:53}];
const route:StoredRoute={id:'ux-route',name:'Ruta UX',description:'Prueba local',createdAt:'2026-11-15T10:00:00Z',updatedAt:'2026-11-15T10:00:00Z',geometry,waypoints:[{...geometry[0],name:'Salida'},geometry[2]],pois:[],profile:buildElevation(geometry),rideType:'road',source:'routing',provider:'test',attribution:'Test'};
describe('Protected route editor and storage boundaries',()=>{
 it('keeps route metadata, raw geometry and elevation in the editable snapshot',()=>{const d=routeEditor(route);expect(d.geometry).toEqual(geometry);expect(d.elevation).toEqual(route.profile);expect(d.routeId).toBe(route.id);expect(d.created).toBe(route.createdAt);});
 it('detects content changes without marking generated identity/timestamps dirty',()=>{const d=routeEditor(route),base=editorContent(d);expect(editorContent({...d,routeId:'new-id',created:'later',savedAt:'now'})).toBe(base);for(const patch of [{name:'Changed'},{description:'Changed'},{rideType:'gravel' as const},{geometry:[...geometry,{lat:39.683,lon:-.27,ele:55}]}])expect(editorContent({...d,...patch})).not.toBe(base);});
 it('recognizes partially drawn and metadata-only drafts',()=>{const blank={...routeEditor(route),name:'Mi ruta desde Sagunto',description:'',points:[],geometry:[],elevation:null};expect(hasEditorWork(blank)).toBe(false);expect(hasEditorWork({...blank,points:[geometry[0]]})).toBe(true);expect(hasEditorWork({...blank,name:'New'})).toBe(true);});
 it('persists editor drafts separately from sessions and route-progress drafts',async()=>{await storage.saveRoute(route);const sim=new RouteSimulationEngine();sim.prepare(route,defaultSimulation,'demo',148);sim.start(0);sim.tick(1000,{power:100,cadence:80,speed:20,heartRate:null},true,'none');await storage.saveRouteDraft(sim.draft());await storage.saveSession(sim.toSession());const d={...routeEditor(route),name:'Unfinished edit'};await storage.saveEditorDraft(d);expect(await storage.editorDraft()).toEqual(d);expect((await storage.routes()).find(r=>r.id===route.id)?.name).toBe('Ruta UX');await storage.clearEditorDraft();expect(await storage.editorDraft()).toBeUndefined();expect((await storage.routeDraft())?.activity.route.id).toBe(route.id);expect((await storage.sessions()).some(s=>s.id===sim.id)).toBe(true);});
 it('preserves saved route and activity snapshots while recovering an edit',async()=>{const saved=await storage.routes(),d=structuredClone(routeEditor(route));d.geometry[0].lat=39.679;d.name='Edited';await storage.saveEditorDraft(d);const restored=await storage.editorDraft();expect(restored?.geometry[0].lat).toBe(39.679);expect((await storage.routes())).toEqual(saved);});
 it('keeps waypoint names while moving their coordinates',()=>{const changed=editPoints(route.waypoints,{type:'update',index:0,point:{lat:39.679,lon:-.272}});expect(changed[0].name).toBe('Salida');expect(changed[0].lat).toBe(39.679);expect(route.waypoints[0].lat).toBe(39.68);});
 it('cancel preparation resets engine without modifying the route',()=>{const sim=new RouteSimulationEngine();sim.prepare(route,defaultSimulation,'demo',148);sim.reset();expect(sim.route).toBeNull();expect(sim.startedSession).toBe(false);expect(route.geometry).toEqual(geometry);});
});
