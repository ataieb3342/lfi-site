import MarkdownIt from 'markdown-it';

const markdown=new MarkdownIt({html:false,linkify:true,breaks:true});
markdown.core.ruler.after('inline','meeting_tasks',(state)=>{
 for(let i=2;i<state.tokens.length;i++){
  const token=state.tokens[i];
  if(token.type!=='inline'||state.tokens[i-1].type!=='paragraph_open'||state.tokens[i-2].type!=='list_item_open')continue;
  const match=/^\[([ xX])\](?:\s+|$)/.exec(token.content);
  const first=token.children?.[0];const line=state.tokens[i-1].map?.[0];
  if(!match||first?.type!=='text'||line===undefined)continue;
  token.meta={taskLine:line};
  first.content=first.content.slice(match[0].length);
  state.tokens[i-2].attrJoin('class','meeting-task');
  const checkbox=new state.Token('html_inline','',0);
  checkbox.content=`<input type="checkbox" data-task-line="${line}" aria-label="${markdown.utils.escapeHtml(token.content.slice(match[0].length))}"${match[1].toLowerCase()==='x'?' checked':''}> `;
  token.children!.unshift(checkbox);
 }
});
export function toggleMeetingTask(body:string,line:number,checked:boolean){
 const tasks=markdown.parse(body,{}).filter(token=>token.meta?.taskLine===line);
 if(!Number.isSafeInteger(line)||tasks.length!==1)throw new Error('Case à cocher introuvable. Rechargez le compte rendu.');
 const lines=body.split('\n');
 const pattern=/^([\s>]*(?:[-+*]|\d+[.)])\s+)\[[ xX]\](?=\s|$)/;
 if(!pattern.test(lines[line]))throw new Error('Case à cocher introuvable.');
 lines[line]=lines[line].replace(pattern,`$1[${checked?'x':' '}]`);
 return lines.join('\n');
}
markdown.renderer.rules.image=(tokens,index)=>`<span>Image : ${markdown.utils.escapeHtml(tokens[index].content)}</span>`;
export function renderMeetingBody(body:string){return markdown.render(body);}
