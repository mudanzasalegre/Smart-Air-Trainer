import {createContext,useContext,useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
const stack:string[]=[];
export function Dialog({title,children,onClose,className=''}:{title:string;children:ReactNode;onClose:()=>void;className?:string}){
 const ref=useRef<HTMLElement>(null),id=useId(),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;stack.push(id);const old=document.body.style.overflow;document.body.style.overflow='hidden';const root=ref.current!;root.focus();const key=(e:KeyboardEvent)=>{if(stack.at(-1)!==id)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close.current();}if(e.key==='Tab'){const items=Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary,[tabindex="0"]')).filter(x=>x.getClientRects().length);const first=items[0],last=items.at(-1);if(!first){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===first||document.activeElement===root)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===root)){e.preventDefault();first.focus();}}};document.addEventListener('keydown',key);return()=>{stack.splice(stack.indexOf(id),1);document.removeEventListener('keydown',key);document.body.style.overflow=old;previous?.focus();};},[id]);
 return createPortal(<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={ref} tabIndex={-1} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={id}><header><h2 id={id}>{title}</h2><button className="icon-button" aria-label={`Cerrar ${title}`} onClick={onClose}><X/></button></header>{children}</section></div>,document.body);
}
type Choice={id:string;label:string;danger?:boolean;primary?:boolean};
type Request={title:string;message:string;choices?:Choice[]};
type Ask=(request:Request)=>Promise<string>;
const Context=createContext<Ask>(async()=> 'cancel');
export function DialogProvider({children}:{children:ReactNode}){
 const [request,setRequest]=useState<Request|null>(null),resolver=useRef<((choice:string)=>void)|null>(null);
 const finish=(id:string)=>{resolver.current?.(id);resolver.current=null;setRequest(null);};
 const ask:Ask=(r)=>new Promise(resolve=>{resolver.current?.('cancel');resolver.current=resolve;setRequest(r);});
 return <Context.Provider value={ask}>{children}{request&&<Dialog title={request.title} onClose={()=>finish('cancel')} className="decision-dialog"><p>{request.message}</p><footer>{(request.choices||[{id:'cancel',label:'Cancelar'},{id:'confirm',label:'Descartar',danger:true}]).map(c=><button key={c.id} className={`button ${c.danger?'danger':c.primary?'primary':'secondary'}`} onClick={()=>finish(c.id)}>{c.label}</button>)}</footer></Dialog>}</Context.Provider>;
}
export function useDecision(){const ask=useContext(Context);return {ask,confirm:async(message:string,title='Confirmar acción',label='Descartar')=>(await ask({title,message,choices:[{id:'cancel',label:'Cancelar'},{id:'confirm',label,danger:true}]}))==='confirm'};}
