import {useEffect,useState} from 'react';
import {storage} from './storage';
export function useFavorites(){
 const [favorites,setFavorites]=useState<string[]>([]),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 useEffect(()=>{let active=true;const load=()=>void storage.trainingPreferences().then(p=>{if(active)setFavorites(p?.favorites||[]);}).catch(e=>{if(active)setError(String(e));});load();window.addEventListener('smart-air-preferences',load);window.addEventListener('smart-air-restored',load);return()=>{active=false;window.removeEventListener('smart-air-preferences',load);window.removeEventListener('smart-air-restored',load);};},[]);
 const toggle=async(key:string)=>{if(saving)return;setSaving(true);setError('');try{await storage.toggleFavorite(key);}catch(e){setError(String(e));}finally{setSaving(false);}};
 return {favorites,toggle,error,saving};
}
