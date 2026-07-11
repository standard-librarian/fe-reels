import type { LucideIcon } from 'lucide-react'
export function IconButton({icon:Icon,label,onClick,active=false,primary=false}:{icon:LucideIcon;label:string;onClick?:()=>void;active?:boolean;primary?:boolean}){
 return <button className="action" onClick={onClick} aria-label={label}><span className={`action__circle ${primary?'action__circle--primary':''} ${active?'action__circle--active':''}`}><Icon size={21} fill={active?'currentColor':'none'}/></span><span>{label}</span></button>
}
