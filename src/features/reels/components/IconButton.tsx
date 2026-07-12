import type { LucideIcon } from 'lucide-react'
export function IconButton({icon:Icon,label,onClick,active=false,primary=false,className=''}:{icon:LucideIcon;label:string;onClick?:()=>void;active?:boolean;primary?:boolean;className?:string}){
 return <button className={`action ${className}`} onClick={onClick} aria-label={label}><span className={`action__circle ${primary?'action__circle--primary':''} ${active?'action__circle--active':''}`}><Icon size={21} fill={active?'currentColor':'none'}/></span><span>{label}</span></button>
}
