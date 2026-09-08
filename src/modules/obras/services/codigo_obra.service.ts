export function proximoCodigo(prefix:string, atual:string|null, ano:number):string{ const seq=atual? parseInt(atual.split('-')[2],10)+1:1; return `${prefix}-${ano}-${String(seq).padStart(4,'0')}`; }
