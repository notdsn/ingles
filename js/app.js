(function(){
'use strict';
var KEY='ingles-v1',D={},app=document.getElementById('app'),titleEl=document.getElementById('title'),back=document.getElementById('back');
var S=load();
function load(){try{var s=JSON.parse(localStorage.getItem(KEY));if(s)return s}catch(e){}return{dias:[],aulas:{},cartoes:{},erros:[],quizzes:[]}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function hoje(d){d=d||new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function diasAtras(n){var d=new Date();d.setDate(d.getDate()-n);return hoje(d)}
function estudou(){var t=hoje();if(S.dias.indexOf(t)<0){S.dias.push(t);save()}}
function streak(){var n=0;var i=S.dias.indexOf(hoje())>=0?0:1;while(S.dias.indexOf(diasAtras(i))>=0){n++;i++}return n}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function norm(s){return String(s).toLowerCase().replace(/[’`]/g,"'").replace(/[.,!?;:]/g,'').replace(/\s+/g,' ').trim()}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function erro(topico,pergunta,dada,certa){S.erros.push({t:topico,p:pergunta,r:dada,c:certa,d:hoje()});if(S.erros.length>500)S.erros=S.erros.slice(-500);save()}
// voz
var voz=null;function pickVoice(){if(!window.speechSynthesis)return;var vs=speechSynthesis.getVoices().filter(function(v){return/en[-_]US/i.test(v.lang)});voz=vs.filter(function(v){return/Samantha|Google US/i.test(v.name)})[0]||vs[0]||null}
if(window.speechSynthesis){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function falar(t,lento){if(!window.speechSynthesis){alert('Seu navegador não tem áudio de leitura.');return}speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang='en-US';if(voz)u.voice=voz;u.rate=lento?0.65:0.9;speechSynthesis.speak(u)}
window.__falar=falar;
function sayBtn(t){return '<button class="say" data-say="'+esc(t)+'">Ouvir</button> <button class="say" data-say="'+esc(t)+'" data-slow="1">Devagar</button>'}
document.addEventListener('click',function(e){var b=e.target.closest('[data-say]');if(b)falar(b.getAttribute('data-say'),b.getAttribute('data-slow'))});
function el(h){app.innerHTML=h;window.scrollTo(0,0)}
function set(t,home){titleEl.textContent=t;back.hidden=!!home}
back.onclick=function(){var h=location.hash.split('/');location.hash=h.length>1?h[0]:'#home'};

// exercício: q, container, modo 'agora' (corrige já) ou 'depois'; cb(certo,resposta)
function exercicio(q,box,modo,cb){
  var h='<p><b>'+esc(q.pergunta)+'</b></p>';
  if(q.audio)h+=sayBtn(q.audio);
  if(q.opcoes)h+=q.opcoes.map(function(o,i){return '<button class="opt" data-i="'+i+'">'+esc(o)+'</button>'}).join('');
  else h+='<input type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Digite aqui"><button class="btn chk">Verificar</button>';
  h+='<div class="fbx"></div>';box.innerHTML=h;var done=false;
  function fim(dada){if(done&&modo==='agora')return;
    var certas=[].concat(q.resposta).map(norm),ok=certas.indexOf(norm(dada))>=0;
    if(modo==='agora'){done=true;
      [].forEach.call(box.querySelectorAll('.opt'),function(b){b.disabled=true;var t=b.textContent;if(certas.indexOf(norm(t))>=0)b.classList.add('ok');else if(t===dada)b.classList.add('bad')});
      var inp=box.querySelector('input');if(inp){inp.disabled=true;box.querySelector('.chk').disabled=true}
      var c=[].concat(q.resposta)[0];
      box.querySelector('.fbx').innerHTML='<div class="fb '+(ok?'ok':'bad')+'">'+(ok?'Certo! ':'Ainda não. Resposta: <b>'+esc(c)+'</b>. ')+esc(q.explicacao||'')+'</div>';
      if(!ok)erro(q.topico,q.pergunta,dada,c);
    }else{[].forEach.call(box.querySelectorAll('.opt'),function(b){b.classList.toggle('sel',b.textContent===dada)})}
    cb(ok,dada)}
  [].forEach.call(box.querySelectorAll('.opt'),function(b){b.onclick=function(){fim(b.textContent)}});
  var inp=box.querySelector('input');if(inp){var go=function(){if(inp.value.trim())fim(inp.value)};box.querySelector('.chk').onclick=go;inp.onkeydown=function(e){if(e.key==='Enter')go()};if(modo==='depois')box.querySelector('.chk').textContent='Confirmar'}
}

// HOME
function home(){set('Inglês do Edson',true);
  var a=aulaDoDia(),feitas=Object.keys(S.aulas).length,due=(function(){var n=0,v=0;cartoesHoje().forEach(function(c){if(S.cartoes[c.id])n++;else if(v<10){v++;n++}});return n})();
  el('<div class="stats"><div class="stat"><b>'+streak()+'</b><span>dias seguidos</span></div><div class="stat"><b>'+feitas+'</b><span>aulas feitas</span></div><div class="stat"><b>'+aprendidos()+'</b><span>palavras</span></div></div>'+
  '<div class="grid">'+
  '<button class="tile wide" data-go="#aula/'+a.id+'"><b>Aula do dia</b><span>'+esc(a.titulo)+' · 30 min'+(S.aulas[a.id]?' · feita':'')+'</span></button>'+
  t('#cartoes','Cartões de memória',due+' para revisar hoje')+t('#gramatica','Gramática','Regras e erros comuns')+
  t('#imersao','Imersão','Textos do dia a dia')+t('#quiz','Quiz da semana','10 perguntas')+
  t('#progresso','Progresso','Sequência e erros')+t('#conversa','Conversação','Pratique com o Jarvys')+
  t('#aula','Todas as aulas',D.aulas.length+' aulas')+t('#progresso/exportar','Exportar progresso','Código para o Jarvys')+'</div>');
  function t(h,b,s){return '<button class="tile" data-go="'+h+'"><b>'+b+'</b><span>'+s+'</span></button>'}
}
document.addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(b)location.hash=b.getAttribute('data-go')});

// AULAS
function aulaDoDia(){var t=hoje(),l=D.aulas.filter(function(a){return a.data<=t});
  var pend=l.filter(function(a){return !S.aulas[a.id]});return pend[0]||l[l.length-1]||D.aulas.filter(function(a){return !S.aulas[a.id]})[0]||D.aulas[0]}
function listaAulas(){set('Aulas');el('<p class="muted">Cada aula leva cerca de 30 minutos.</p>'+D.aulas.map(function(a){return '<button class="lbtn" data-go="#aula/'+a.id+'"><span class="tag">'+esc(a.foco)+'</span><span class="muted">'+fmt(a.data)+'</span><br><b>'+esc(a.titulo)+'</b>'+(S.aulas[a.id]?' <span class="done">Feita · '+S.aulas[a.id].nota+'/'+a.quiz.length+'</span>':'')+'</button>'}).join(''))}
function fmt(d){var p=d.split('-');return p[2]+'/'+p[1]}
function aula(id){var a=D.aulas.filter(function(x){return x.id===id})[0];if(!a)return listaAulas();set('Aula do dia');
  var etapas=['Aquecimento (5 min)','Explicação (7 min)','Exemplos (5 min)','Exercícios (8 min)','Mini quiz (5 min)'],k=0,nota=0,qi=0;
  function draw(){var h='<div class="prog"><i style="width:'+(k/5*100)+'%"></i></div><span class="tag">'+esc(a.foco)+'</span><h2>'+esc(a.titulo)+'</h2>';
    if(k===5){h+='<div class="card"><h3>Aula concluída</h3><p>Mini quiz: <b>'+nota+' de '+a.quiz.length+'</b>.</p><p class="muted">Seu progresso foi salvo. Revise os cartões de memória para fixar.</p></div><button class="btn" data-go="#cartoes">Ir para os cartões</button><button class="btn sec" data-go="#home">Início</button>';el(h);return}
    h+='<p class="muted">Etapa '+(k+1)+' de 5 · '+etapas[k]+'</p><div class="card" id="c"></div><button class="btn" id="nx">Continuar</button>';el(h);
    var c=document.getElementById('c'),nx=document.getElementById('nx');nx.onclick=function(){k++;qi=0;if(k===5){S.aulas[a.id]={data:hoje(),nota:nota};estudou();save()}draw()};
    if(k===0)c.innerHTML='<p>'+esc(a.aquecimento.texto)+'</p>'+a.aquecimento.frases.map(function(f){return '<div class="ex"><b>'+esc(f)+'</b><br>'+sayBtn(f)+'</div>'}).join('');
    if(k===1)c.innerHTML=a.explicacao.map(function(p){return '<p>'+esc(p)+'</p>'}).join('');
    if(k===2)c.innerHTML=a.exemplos.map(function(x){return '<div class="ex"><b>'+esc(x.en)+'</b><div class="pt">'+esc(x.pt)+'</div>'+sayBtn(x.en)+'</div>'}).join('');
    if(k===3||k===4){var lista=k===3?a.exercicios:a.quiz;nx.disabled=true;
      (function um(){var q=lista[qi];c.innerHTML='<p class="muted">'+(qi+1)+' de '+lista.length+'</p><div id="q"></div>';
        exercicio(q,document.getElementById('q'),'agora',function(ok){if(k===4&&ok)nota++;
          if(qi<lista.length-1){nx.disabled=false;nx.textContent='Próxima';nx.onclick=function(){qi++;nx.disabled=true;um()}}
          else{nx.disabled=false;nx.textContent='Continuar';nx.onclick=function(){k++;qi=0;if(k===5){S.aulas[a.id]={data:hoje(),nota:nota};estudou();save()}nx.textContent='Continuar';draw()}}})})()}
  }draw()}

// CARTÕES (Leitner: caixas 1..5, intervalos em dias)
var INT=[0,1,2,4,8,16];
function cartoesHoje(){var t=hoje();return D.cartoes.filter(function(c){var s=S.cartoes[c.id];return !s||s.next<=t})}
function aprendidos(){return Object.keys(S.cartoes).filter(function(k){return S.cartoes[k].box>=3}).length}
function cartoes(){set('Cartões de memória');var fila=cartoesHoje(),novos=0;
  fila=fila.filter(function(c){if(S.cartoes[c.id])return true;return novos++<10});
  var i=0;
  function draw(){if(i>=fila.length){el('<div class="card"><h2>Tudo revisado por hoje</h2><p class="muted">Volte amanhã para novas revisões. Palavras aprendidas: <b>'+aprendidos()+'</b> de '+D.cartoes.length+'.</p></div><button class="btn sec" id="mais">Revisar mais 10 palavras</button><button class="btn" data-go="#home">Início</button>');
      document.getElementById('mais').onclick=function(){fila=shuffle(D.cartoes).slice(0,10);i=0;draw()};return}
    var c=fila[i],s=S.cartoes[c.id];
    el('<div class="prog"><i style="width:'+(i/fila.length*100)+'%"></i></div><p class="muted">'+(i+1)+' de '+fila.length+' · caixa '+(s?s.box:1)+' · toque no cartão para virar</p>'+
    '<div class="flip" id="f"><div class="fi"><div class="face"><div class="w">'+esc(c.en)+'</div><div>'+sayBtn(c.en)+'</div></div>'+
    '<div class="face b"><div class="w" style="font-size:24px">'+esc(c.pt)+'</div><p><b>'+esc(c.exemplo)+'</b></p>'+sayBtn(c.exemplo)+'<p class="muted">Dica: '+esc(c.dica)+'</p></div></div></div>'+
    '<div class="row hide" id="r"><button class="btn" style="background:#b42318" data-a="0">Errei</button><button class="btn" style="background:#b7791f" data-a="1">Difícil</button><button class="btn" style="background:#1a7f4b" data-a="2">Fácil</button></div>');
    var f=document.getElementById('f');f.onclick=function(e){if(e.target.closest('.say'))return;f.classList.toggle('on');document.getElementById('r').classList.remove('hide')};
    [].forEach.call(document.querySelectorAll('[data-a]'),function(b){b.onclick=function(){var a=+b.getAttribute('data-a'),box=s?s.box:1;
      if(a===0){box=1;erro('Vocabulário','Significado de "'+c.en+'"','errei',c.pt)}else if(a===2)box=Math.min(5,box+1);
      var d=new Date();d.setDate(d.getDate()+(a===0?0:INT[box]));var rev=(s&&s.rev)||[];rev.push(hoje());if(rev.length>10)rev=rev.slice(-10);
      S.cartoes[c.id]={box:box,next:a===0?hoje():hoje(d),rev:rev};estudou();save();if(a===0&&fila.length<40)fila.push(c);i++;draw()}})}
  draw()}

// GRAMÁTICA
function gramatica(){set('Gramática');el(D.gramatica.map(function(g){return '<div class="card"><h2>'+esc(g.titulo)+'</h2>'+g.regra.map(function(r){return '<p>'+esc(r)+'</p>'}).join('')+
  '<h3>Exemplos</h3>'+g.exemplos.map(function(x){return '<div class="ex"><b>'+esc(x)+'</b> '+sayBtn(x)+'</div>'}).join('')+
  '<h3>Os 3 erros mais comuns</h3>'+g.erros.map(function(e){return '<div class="err"><s>'+esc(e.errado)+'</s><br><span class="c">'+esc(e.certo)+'</span><div class="muted">'+esc(e.porque)+'</div></div>'}).join('')+'</div>'}).join(''))}

// IMERSÃO
function imersaoLista(){set('Imersão');el('<p class="muted">Leia o texto em português, depois veja a versão em inglês e responda.</p>'+D.imersao.map(function(t){return '<button class="lbtn" data-go="#imersao/'+t.id+'"><b>'+esc(t.titulo)+'</b>'+(S['im_'+t.id]?' <span class="done">Feito</span>':'')+'</button>'}).join(''))}
function imersao(id){var t=D.imersao.filter(function(x){return x.id===id})[0];if(!t)return imersaoLista();set('Imersão');
  el('<h2>'+esc(t.titulo)+'</h2><div class="card"><p>'+esc(t.pt)+'</p><button class="btn sec" id="tg">Mostrar em inglês</button><div id="en" class="hide"><p><b>'+esc(t.en)+'</b></p>'+sayBtn(t.en)+'</div></div><h3>Perguntas</h3>'+
  t.perguntas.map(function(q,i){return '<div class="card"><span class="tag">'+q.tipo+'</span><div id="iq'+i+'"></div></div>'}).join('')+'<button class="btn" data-go="#imersao">Outros textos</button>');
  document.getElementById('tg').onclick=function(){var e=document.getElementById('en');e.classList.toggle('hide');this.textContent=e.classList.contains('hide')?'Mostrar em inglês':'Esconder inglês'};
  t.perguntas.forEach(function(q,i){exercicio(q,document.getElementById('iq'+i),'agora',function(){S['im_'+t.id]=1;estudou();save()})})}

// QUIZ DA SEMANA
function quiz(){set('Quiz da semana');var lim=diasAtras(6),pool=[],fonte;
  D.aulas.forEach(function(a){var s=S.aulas[a.id];if(s&&s.data>=lim)pool=pool.concat(a.exercicios,a.quiz)});
  var cs=D.cartoes.filter(function(c){var s=S.cartoes[c.id];return s&&s.rev&&s.rev.some(function(d){return d>=lim})});
  fonte=pool.length||cs.length?'do que você estudou nos últimos 7 dias':'de todas as aulas (você ainda não estudou nesta semana)';
  if(!pool.length&&!cs.length)D.aulas.forEach(function(a){pool=pool.concat(a.quiz)});
  var all=D.cartoes;cs.forEach(function(c){var errs=shuffle(all.filter(function(x){return x.id!==c.id})).slice(0,2).map(function(x){return x.pt});
    pool.push({pergunta:'O que significa "'+c.en+'"?',opcoes:shuffle([c.pt].concat(errs)),resposta:c.pt,topico:'Vocabulário',explicacao:c.exemplo})});
  var qs=shuffle(pool),ca=shuffle(cs.length?pool.filter(function(q){return q.topico==='Vocabulário'}):[]),ga=qs.filter(function(q){return q.topico!=='Vocabulário'});
  qs=shuffle(ga.slice(0,Math.max(10-ca.length,6)).concat(ca)).slice(0,10);
  if(qs.length<10)qs=qs.concat(shuffle(pool).filter(function(q){return qs.indexOf(q)<0})).slice(0,10);
  var resp=[],i=0;
  el('<div class="card"><p>10 perguntas '+fonte+'.</p><p class="muted">As respostas e correções aparecem só no final.</p></div><button class="btn" id="st">Começar</button>');
  document.getElementById('st').onclick=um;
  function um(){var q=qs[i];el('<div class="prog"><i style="width:'+(i/qs.length*100)+'%"></i></div><p class="muted">Pergunta '+(i+1)+' de '+qs.length+'</p><div class="card" id="q"></div><button class="btn" id="nx" disabled>'+(i<qs.length-1?'Próxima':'Ver resultado')+'</button>');
    var nx=document.getElementById('nx');exercicio(q,document.getElementById('q'),'depois',function(ok,d){resp[i]={ok:ok,d:d};nx.disabled=false});
    nx.onclick=function(){i++;if(i<qs.length)um();else fim()}}
  function fim(){var n=0;resp.forEach(function(r,k){if(r.ok)n++;else erro(qs[k].topico,qs[k].pergunta,r.d,[].concat(qs[k].resposta)[0])});
    S.quizzes.push({d:hoje(),n:n,t:qs.length});estudou();save();
    el('<div class="card"><h2>Resultado: '+n+' de '+qs.length+'</h2></div>'+qs.map(function(q,k){var r=resp[k];return '<div class="card"><p><b>'+(k+1)+'. '+esc(q.pergunta)+'</b></p><div class="fb '+(r.ok?'ok':'bad')+'">Sua resposta: '+esc(r.d)+(r.ok?' (certo)':'<br>Correta: <b>'+esc([].concat(q.resposta)[0])+'</b>')+'</div><p class="muted">'+esc(q.explicacao||'')+'</p></div>'}).join('')+'<button class="btn" data-go="#home">Início</button>')}
}

// PROGRESSO
function contaErros(){var m={};S.erros.forEach(function(e){m[e.t]=(m[e.t]||0)+1});return Object.keys(m).map(function(k){return[k,m[k]]}).sort(function(a,b){return b[1]-a[1]})}
function codigo(){var e=contaErros().map(function(x){return x[0]+'='+x[1]}).join(';')||'nenhum';
  var a=D.aulas.filter(function(x){return S.aulas[x.id]}).map(function(x){return x.id+':'+S.aulas[x.id].nota+'/'+x.quiz.length}).join(',')||'nenhuma';
  var q=S.quizzes.slice(-5).map(function(x){return x.n+'/'+x.t}).join(',')||'nenhum';
  var pf={};S.erros.forEach(function(x){pf[x.p]=(pf[x.p]||0)+1});var top=Object.keys(pf).sort(function(a,b){return pf[b]-pf[a]}).slice(0,5).join(' | ')||'-';
  return 'INGLES-EDSON v1 | data='+hoje()+' | sequencia='+streak()+' | aulas='+a+' | palavras='+aprendidos()+'/'+D.cartoes.length+' | quizzes='+q+' | erros='+e+' | top_erros='+top}
function progresso(sub){set('Progresso');var ce=contaErros(),mx=ce.length?ce[0][1]:1;
  var pf={};S.erros.forEach(function(x){var k=x.p+' — certo: '+x.c;pf[k]=pf[k]||{n:0,t:x.t};pf[k].n++});
  var top=Object.keys(pf).sort(function(a,b){return pf[b].n-pf[a].n}).slice(0,8);
  el('<div class="stats"><div class="stat"><b>'+streak()+'</b><span>dias seguidos</span></div><div class="stat"><b>'+Object.keys(S.aulas).length+'/'+D.aulas.length+'</b><span>aulas</span></div><div class="stat"><b>'+aprendidos()+'</b><span>palavras aprendidas</span></div></div>'+
  '<div class="card" id="exp"><h3>Exportar progresso</h3><p class="muted">Copie o código e cole na conversa com o Jarvys para ele preparar as próximas aulas.</p><textarea readonly id="cod">'+esc(codigo())+'</textarea><button class="btn" id="cp">Copiar código</button></div>'+
  '<div class="card"><h3>Erros por tema</h3>'+(ce.length?ce.map(function(x){return '<div style="margin:6px 0">'+esc(x[0])+' <span class="muted">('+x[1]+')</span><div class="prog" style="margin:4px 0 0"><i style="width:'+(x[1]/mx*100)+'%;background:#b42318"></i></div></div>'}).join(''):'<p class="muted">Nenhum erro registrado ainda.</p>')+'</div>'+
  '<div class="card"><h3>Erros mais frequentes</h3>'+(top.length?top.map(function(k){return '<div class="ex">'+esc(k)+' <span class="muted">('+pf[k].n+'x · '+esc(pf[k].t)+')</span></div>'}).join(''):'<p class="muted">Nada ainda.</p>')+'</div>'+
  '<div class="card"><h3>Quizzes da semana</h3>'+(S.quizzes.length?S.quizzes.slice().reverse().map(function(q){return '<div class="ex">'+fmt(q.d)+' · <b>'+q.n+'/'+q.t+'</b></div>'}).join(''):'<p class="muted">Nenhum quiz feito.</p>')+'</div>'+
  '<div class="card"><h3>Aulas concluídas</h3>'+(Object.keys(S.aulas).length?D.aulas.filter(function(a){return S.aulas[a.id]}).map(function(a){return '<div class="ex">'+esc(a.titulo)+' <span class="muted">'+fmt(S.aulas[a.id].data)+' · '+S.aulas[a.id].nota+'/'+a.quiz.length+'</span></div>'}).join(''):'<p class="muted">Nenhuma ainda.</p>')+'</div>'+
  '<button class="btn sec" id="rz">Apagar todo o progresso</button>');
  document.getElementById('cp').onclick=function(){var t=document.getElementById('cod'),b=this;t.select();t.setSelectionRange(0,99999);
    var ok=function(){b.textContent='Copiado'};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t.value).then(ok,function(){document.execCommand('copy');ok()});else{document.execCommand('copy');ok()}};
  document.getElementById('rz').onclick=function(){if(confirm('Apagar todo o progresso?')){localStorage.removeItem(KEY);S=load();progresso()}};
  if(sub==='exportar')document.getElementById('exp').scrollIntoView()}
function conversa(){set('Conversação');el('<div class="card"><h2>Pratique conversando</h2><p>A prática de conversação acontece no chat com o <b>Jarvys</b>. Este aplicativo não usa inteligência artificial.</p><p>Como fazer:</p><p>1. Abra a conversa com o Jarvys.<br>2. Escreva: "Vamos praticar inglês" e diga o tema (por exemplo: trabalho na farmácia).<br>3. Responda em inglês, mesmo com erros. Ele corrige com calma.</p><p class="muted">Dica: antes, cole o código de "Exportar progresso" para ele saber o que você já estudou.</p></div><button class="btn" data-go="#progresso/exportar">Exportar progresso</button>')}

function route(){if(!D.aulas)return;if(window.speechSynthesis)speechSynthesis.cancel();var h=(location.hash||'#home').slice(1).split('/');
  ({home:home,aula:function(){h[1]?aula(h[1]):listaAulas()},cartoes:cartoes,gramatica:gramatica,imersao:function(){h[1]?imersao(h[1]):imersaoLista()},quiz:quiz,progresso:function(){progresso(h[1])},conversa:conversa}[h[0]]||home)()}
window.addEventListener('hashchange',route);
Promise.all(['aulas','cartoes','gramatica','imersao'].map(function(n){return fetch('data/'+n+'.json',{cache:'no-cache'}).then(function(r){return r.json()}).then(function(j){D[n]=j})}))
  .then(function(){D.aulas.sort(function(a,b){return a.data<b.data?-1:1});route()}).catch(function(e){app.innerHTML='<div class="card">Erro ao carregar os dados. Verifique a internet e recarregue.</div>'});
window.__S=function(){return S};
})();
