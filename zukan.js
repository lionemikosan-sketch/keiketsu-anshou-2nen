/* ======================================================================
   経絡ずかん（経穴暗唱スタンプラリー 2年生版の「ずかん」タブ）
   図はすべてオリジナルの作図（教科書の図はなぞっていない）。
   座標は 700×1300 の全身図の上の位置。経穴は骨度法と脊椎の高さから置いた。
   前＝解剖学的立位の前面（被験者の右半身が画面の左）／後＝後面（被験者の右半身が画面の右）
   横＝左側面（顔が画面の右、腕は点線）／内側＝右下肢の内側面（つま先が画面の左）
   アプリ本体（index.html）の store・save・sfx・buzz・openSheet などを使う。
   ====================================================================== */
const Zukan=(()=>{
const VIEWS={f:"前",b:"後",s:"横",m:"内側"};
const BOUNDS={f:[0,40,700,1260],b:[0,40,700,1260],s:[150,40,600,1260],m:[180,600,560,1260]};

// ---------- 体の輪郭 ----------
const FRONT_R=[[306,214],[304,236],[300,252],[280,262],[246,272],[210,284],[194,298],[186,322],[183,380],[180,430],[178,470],[172,520],[166,590],[160,650],[154,664],[146,680],[139,704],[143,712],[151,704],[157,692],[161,702],[161,730],[166,750],[171,731],[173,706],[173,735],[178,758],[183,736],[184,706],[184,733],[189,752],[194,733],[195,704],[196,724],[200,740],[204,722],[206,698],[206,672],[206,650],[210,600],[216,540],[222,470],[226,420],[230,352],[236,340],[238,380],[242,430],[248,490],[250,520],[246,570],[238,610],[232,640],[234,700],[244,780],[256,850],[262,900],[262,940],[262,1000],[268,1060],[276,1112],[278,1126],[270,1145],[264,1168],[266,1180],[272,1185],[281,1187],[291,1190],[300,1192],[310,1192],[318,1186],[322,1170],[322,1150],[322,1124],[320,1100],[316,1040],[318,980],[324,930],[328,900],[332,850],[338,780],[344,700],[348,672]];
const MX=x=>700-x;
const FULL=[...FRONT_R,[350,676],...FRONT_R.slice().reverse().map(([x,y])=>[MX(x),y])];
const HEAD_F="M350,60 C385,60 408,92 408,138 C408,168 404,192 398,204 C388,218 370,226 350,226 C330,226 312,218 302,204 C296,192 292,168 292,138 C292,92 315,60 350,60Z";
const SIDE_TORSO=[[330,56],[366,62],[388,82],[395,104],[396,120],[393,130],[398,145],[410,165],[402,174],[403,186],[398,192],[402,198],[396,214],[390,224],[372,230],[370,246],[374,262],[388,300],[398,340],[400,372],[394,410],[388,440],[390,480],[394,520],[398,560],[394,600],[384,640],[376,662],[340,676],[300,674],[276,640],[270,600],[282,560],[298,520],[300,480],[292,430],[286,370],[286,320],[292,280],[300,262],[290,224],[284,206],[272,180],[266,150],[270,110],[290,74]];
const SIDE_LEG=[[378,648],[376,720],[372,800],[370,860],[370,888],[366,920],[360,980],[356,1050],[354,1100],[352,1118],[372,1135],[400,1150],[425,1160],[444,1166],[450,1174],[444,1182],[380,1184],[320,1184],[298,1180],[294,1160],[300,1140],[306,1110],[300,1060],[296,1000],[302,950],[318,912],[310,880],[302,820],[298,760],[290,700],[282,668],[300,650],[340,640]];

const f1=v=>v.toFixed(1);
function closed(P){
  const n=P.length;let d=`M${P[0][0]},${P[0][1]}`;
  for(let i=0;i<n;i++){const p0=P[(i-1+n)%n],p1=P[i],p2=P[(i+1)%n],p3=P[(i+2)%n];
    d+=` C${f1(p1[0]+(p2[0]-p0[0])/6)},${f1(p1[1]+(p2[1]-p0[1])/6)} ${f1(p2[0]-(p3[0]-p1[0])/6)},${f1(p2[1]-(p3[1]-p1[1])/6)} ${p2[0]},${p2[1]}`;}
  return d+"Z";
}
// 経絡の線：点の間隔がばらばらでも膨らんだり折り返したりしないよう、接線の長さを区間の長さで抑える
function curves(P){ // [始点, 制御点1, 制御点2, 終点] の並び
  const lim=(v,L)=>{const m=Math.hypot(v[0],v[1]),mx=L*0.36;return m>mx&&m>0?[v[0]*mx/m,v[1]*mx/m]:v;};
  const C=[];
  for(let i=0;i<P.length-1;i++){
    const p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||P[i+1],L=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]);
    const t1=lim([(p2[0]-p0[0])/6,(p2[1]-p0[1])/6],L),t2=lim([(p3[0]-p1[0])/6,(p3[1]-p1[1])/6],L);
    C.push([p1,[p1[0]+t1[0],p1[1]+t1[1]],[p2[0]-t2[0],p2[1]-t2[1]],p2]);
  }
  return C;
}
function open(P){
  if(P.length<2)return"";let d=`M${P[0][0]},${P[0][1]}`;
  for(const [,c1,c2,p2] of curves(P))d+=` C${f1(c1[0])},${f1(c1[1])} ${f1(c2[0])},${f1(c2[1])} ${p2[0]},${p2[1]}`;
  return d;
}
function cubicLen([a,b,c,d]){ // 1本の3次曲線の長さ（16分割の折れ線で近似）
  let L=0,px=a[0],py=a[1];
  for(let i=1;i<=16;i++){const u=i/16,v=1-u,x=v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*c[0]+u*u*u*d[0],y=v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*c[1]+u*u*u*d[1];L+=Math.hypot(x-px,y-py);px=x;py=y;}
  return L;
}
const mir=d=>d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,(_,x,y)=>`${MX(+x)},${y}`);
const det=(d,cls="det")=>`<path class="${cls}" d="${d}"/>`;
const both=(arr,cls="det")=>arr.map(d=>det(d,cls)+det(mir(d),cls)).join("");

function figure(v){
  if(v==="f")return `
    <ellipse class="detf" cx="291" cy="150" rx="8" ry="20"/><ellipse class="detf" cx="409" cy="150" rx="8" ry="20"/>
    <path class="body" d="${closed(FULL)}"/><path class="body" d="${HEAD_F}"/>
    <path class="hairfill" d="M298,108 C300,70 330,60 350,60 C372,60 402,72 403,108 C390,86 312,86 298,108Z"/>
    ${both(["M318,122 Q330,116 342,121","M348,262 C320,268 262,274 214,284","M236,342 C262,388 318,398 346,392","M350,432 C324,452 284,478 252,500","M246,612 C280,632 318,652 344,666","M180,470 Q200,476 222,470","M160,672 Q170,690 177,700","M281,1187 L282,1177","M291,1190 L291,1179","M300,1192 L300,1179","M310,1192 L309,1178"])}
    ${both(["M160,650 Q183,656 206,650","M296,918 C298,980 300,1040 300,1100"],"crease")}
    <ellipse class="det" cx="330" cy="136" rx="8" ry="3.2"/><ellipse class="det" cx="370" cy="136" rx="8" ry="3.2"/>
    ${det("M347,128 L343,165 Q346,172 350,172 Q354,172 357,165")}${det("M336,190 Q350,196 364,190")}${det("M347,175 L348,184 M353,175 L352,184")}
    ${det("M340,262 Q350,270 360,262")}${det("M346,236 Q350,242 354,236")}${det("M340,208 Q350,212 360,208")}
    <circle class="det" cx="288" cy="372" r="2.5"/><circle class="det" cx="412" cy="372" r="2.5"/>
    <ellipse class="det" cx="350" cy="560" rx="2.5" ry="4"/>
    <ellipse class="det" cx="294" cy="888" rx="13" ry="17"/><ellipse class="det" cx="406" cy="888" rx="13" ry="17"/>`;
  if(v==="b")return `
    <ellipse class="detf" cx="291" cy="150" rx="8" ry="20"/><ellipse class="detf" cx="409" cy="150" rx="8" ry="20"/>
    <path class="body" d="${closed(FULL)}"/><path class="body hairfill" d="${HEAD_F}"/>
    ${det("M312,212 Q350,222 388,212")}${det("M350,250 L350,612","crease")}<circle class="det" cx="350" cy="258" r="2.5"/>
    ${both(["M397,298 L397,372 Q404,384 418,376 L466,328 Q472,304 470,292","M397,306 L480,290","M354,514 C380,506 412,506 446,520","M352,672 C382,690 420,688 452,668","M378,905 Q405,912 434,905","M403,1060 L404,1116","M384,1182 Q405,1190 426,1182","M486,470 Q500,462 514,470"])}
    ${both(["M494,650 Q517,646 540,650"],"crease")}${det("M350,600 L350,670")}`;
  if(v==="s")return `
    <path class="body" d="${closed(SIDE_TORSO)}"/>
    <path class="hairfill" d="M392,88 C380,66 350,54 330,56 C300,58 274,82 268,116 C266,140 268,170 280,200 C292,190 298,160 304,140 C312,122 330,116 352,112 C362,100 376,92 392,88Z"/>
    <path class="body" d="${closed(SIDE_LEG)}"/>
    ${det("M322,126 C334,126 336,150 333,166 C330,176 320,178 316,172 C312,160 312,136 322,126Z","detf")}${det("M322,136 C328,140 328,156 322,162")}
    ${det("M368,137 Q377,132 386,136 Q377,141 368,137")}${det("M364,121 Q378,115 392,119")}
    ${det("M400,168 Q404,172 402,174")}${det("M398,192 L388,191")}${det("M392,222 C372,222 346,214 334,204 C328,196 328,186 330,178")}
    <circle class="det" cx="398" cy="372" r="2.5"/>${det("M372,868 C380,880 380,900 370,912")}<circle class="det" cx="334" cy="925" r="3"/>
    <ellipse class="det" cx="322" cy="1126" rx="7" ry="8"/>${det("M420,1180 L421,1170 M432,1181 L433,1171")}
    <path class="ghost" d="M296,282 C288,330 292,420 296,470 C300,520 306,600 312,650 C320,668 340,668 346,650 C344,600 342,520 344,470 C348,420 354,330 350,282"/>
    <text class="note" x="300" y="700" text-anchor="end">腕（点線）</text>`;
  if(v==="m")return `
    <defs><linearGradient id="zFadeTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFBF7" stop-opacity="1"/><stop offset="1" stop-color="#FFFBF7" stop-opacity="0"/></linearGradient></defs>
    <path class="body" d="${closed(SIDE_LEG.map(([x,y])=>[MX(x),y]))}"/>
    <rect x="250" y="600" width="220" height="80" fill="url(#zFadeTop)"/>
    <ellipse class="det" cx="376" cy="1120" rx="8" ry="9"/><circle class="det" cx="330" cy="1152" r="2.5"/>
    ${det("M300,1182 C320,1172 350,1170 380,1180")}${det("M328,868 C320,880 320,900 330,912")}
    <text class="note" x="420" y="1215" text-anchor="middle">足底（下の縁）</text>`;
  return "";
}

// ---------- 経絡データ：名前:読み:向き:x,y ／ segs の番号は1始まり、[x,y]は通過点 ----------
const P=s=>s.trim().split(/\s*;\s*/).filter(Boolean).map(t=>{const [n,y,v,xy]=t.split(":");const [x,yy]=xy.split(",").map(Number);return {n,y,v,p:[x,yy]};});
const R=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const MERS=[
 {id:"LU",name:"手の太陰肺経",yomi:"てのたいいんはいけい",short:"肺経",c:"metal",from:"中府",to:"少商",
  pts:P(`中府:ちゅうふ:f:258,298; 雲門:うんもん:f:258,282; 天府:てんぷ:f:197,390; 侠白:きょうはく:f:196,405; 尺沢:しゃくたく:f:193,470; 孔最:こうさい:f:182,545; 列欠:れっけつ:f:168,627; 経渠:けいきょ:f:168,637; 太淵:たいえん:f:167,650; 魚際:ぎょさい:f:151,677; 少商:しょうしょう:f:141,702`),
  segs:[{v:"f",s:[1,2,[236,296],[210,336],...R(3,11)]}],
  branch:{v:"f",d:"M168,627 C171,670 167,715 162,746",lbl:[150,772,"end","支脈：列欠から示指の端（商陽）へ → 大腸経"]},
  internal:{v:"f",d:"M350,495 C344,540 344,590 352,600 C362,590 372,520 372,478 C368,462 356,448 350,436 C336,410 300,392 298,360 C296,330 330,300 348,276 C350,262 350,250 350,236 C320,250 286,280 258,298",
   lbls:[[362,500,"start","① 中焦から起こる"],[360,614,"start","② 下って大腸をまとう（絡）"],[386,482,"start","③ 胃口をめぐる"],[356,430,"start","④ 横隔膜を通る"],[270,412,"start","⑤ 肺に属する"],[342,238,"end","⑥ 肺系（気管・喉頭）"],[270,316,"start","⑦ 腋の下に出て中府へ"]],
   fit:[220,220,480,660]}},
 {id:"LI",name:"手の陽明大腸経",yomi:"てのようめいだいちょうけい",short:"大腸経",c:"metal",from:"商陽",to:"迎香",
  pts:P(`商陽:しょうよう:b:538,742; 二間:じかん:b:538,710; 三間:さんかん:b:538,697; 合谷:ごうこく:b:536,682; 陽渓:ようけい:b:535,652; 偏歴:へんれき:b:529,607; 温溜:おんる:b:525,575; 下廉:げれん:b:521,530; 上廉:じょうれん:b:520,515; 手三里:てのさんり:b:519,500; 曲池:きょくち:b:517,472; 肘髎:ちゅうりょう:b:516,455; 手五里:てのごり:b:515,425; 臂臑:ひじゅ:b:512,365; 肩髃:けんぐう:b:506,296; 巨骨:ここつ:b:480,283;
    天鼎:てんてい:f:302,253; 扶突:ふとつ:f:306,238; 禾髎:かりょう:f:359,178; 迎香:げいこう:f:363,169`),
  segs:[{v:"b",s:R(1,16)},{v:"f",s:[17,18,[330,206],[350,181],19,20]}],
  cross:"水溝で左右が交差し、反対側の迎香で終わる"},
 {id:"ST",name:"足の陽明胃経",yomi:"あしのようめいいけい",short:"胃経",c:"earth",from:"承泣",to:"厲兌",
  pts:P(`承泣:しょうきゅう:f:330,146; 四白:しはく:f:330,155; 巨髎:こりょう:f:330,171; 地倉:ちそう:f:331,190; 大迎:だいげい:f:316,212; 頬車:きょうしゃ:f:304,198; 下関:げかん:f:299,152; 頭維:ずい:f:305,92;
    人迎:じんげい:f:322,238; 水突:すいとつ:f:322,250; 気舎:きしゃ:f:330,262; 欠盆:けつぼん:f:288,266; 気戸:きこ:f:288,281; 庫房:こぼう:f:288,297; 屋翳:おくえい:f:288,320; 膺窓:ようそう:f:288,345; 乳中:にゅうちゅう:f:288,372; 乳根:にゅうこん:f:288,395;
    不容:ふよう:f:319,462; 承満:しょうまん:f:319,479; 梁門:りょうもん:f:319,495; 関門:かんもん:f:319,511; 太乙:たいいつ:f:319,528; 滑肉門:かつにくもん:f:319,544; 天枢:てんすう:f:319,560; 外陵:がいりょう:f:319,576; 大巨:だいこ:f:319,592; 水道:すいどう:f:319,609; 帰来:きらい:f:319,625; 気衝:きしょう:f:319,641;
    髀関:ひかん:f:268,680; 伏兎:ふくと:f:276,794; 陰市:いんし:f:279,832; 梁丘:りょうきゅう:f:281,845; 犢鼻:とくび:f:286,912; 足三里:あしのさんり:f:286,952; 上巨虚:じょうこきょ:f:287,992; 条口:じょうこう:f:288,1017; 下巨虚:げこきょ:f:289,1030; 豊隆:ほうりゅう:f:276,1017; 解渓:かいけい:f:299,1122; 衝陽:しょうよう:f:300,1145; 陥谷:かんこく:f:298,1162; 内庭:ないてい:f:296,1178; 厲兌:れいだ:f:292,1188`),
  segs:[{v:"f",s:R(1,8)},{v:"f",s:[5,[314,226],...R(9,18),[304,430],...R(19,30),[290,662],...R(31,39),[283,1022],40,[293,1076],41,42,43,44,45]}],
  cross:"顔で一度上に頭維まで上がり、大迎から分かれて首・胸・腹・脚を下る"},
 {id:"SP",name:"足の太陰脾経",yomi:"あしのたいいんひけい",short:"脾経",c:"earth",from:"隠白",to:"大包",
  pts:P(`隠白:いんぱく:m:258,1171; 大都:だいと:m:280,1173; 太白:たいはく:m:293,1173; 公孫:こうそん:m:316,1171; 商丘:しょうきゅう:m:352,1137; 三陰交:さんいんこう:m:360,1072; 漏谷:ろうこく:m:358,1027; 地機:ちき:m:358,966; 陰陵泉:いんりょうせん:m:360,922; 血海:けっかい:m:340,848; 箕門:きもん:m:346,772;
    衝門:しょうもん:f:296,641; 府舎:ふしゃ:f:288,630; 腹結:ふっけつ:f:288,581; 大横:だいおう:f:288,560; 腹哀:ふくあい:f:288,511; 食竇:しょくとく:f:257,395; 天渓:てんけい:f:257,372; 胸郷:きょうきょう:f:257,345; 周栄:しゅうえい:f:257,320; 大包:だいほう:f:246,416`),
  segs:[{v:"m",s:R(1,11)},{v:"f",s:[12,13,14,15,16,[268,452],17,18,19,20,[250,368],21]}]},
 {id:"HT",name:"手の少陰心経",yomi:"てのしょういんしんけい",short:"心経",c:"fire",from:"極泉",to:"少衝",
  pts:P(`極泉:きょくせん:f:232,348; 青霊:せいれい:f:223,425; 少海:しょうかい:f:219,470; 霊道:れいどう:f:204,627; 通里:つうり:f:204,635; 陰郄:いんげき:f:204,642; 神門:しんもん:f:204,650; 少府:しょうふ:f:195,688; 少衝:しょうしょう:f:197,735`),
  segs:[{v:"f",s:R(1,9)}]},
 {id:"SI",name:"手の太陽小腸経",yomi:"てのたいようしょうちょうけい",short:"小腸経",c:"fire",from:"少沢",to:"聴宮",
  pts:P(`少沢:しょうたく:b:497,736; 前谷:ぜんこく:b:496,708; 後渓:こうけい:b:496,694; 腕骨:わんこつ:b:495,668; 陽谷:ようこく:b:496,652; 養老:ようろう:b:499,637; 支正:しせい:b:492,575; 小海:しょうかい:b:483,470; 肩貞:けんてい:b:472,334; 臑兪:じゅゆ:b:472,304; 天宗:てんそう:b:432,340; 秉風:へいふう:b:432,297; 曲垣:きょくえん:b:404,302; 肩外兪:けんがいゆ:b:395,275; 肩中兪:けんちゅうゆ:b:381,259;
    天窓:てんそう:s:314,236; 天容:てんよう:s:326,212; 顴髎:けんりょう:s:368,160; 聴宮:ちょうきゅう:s:335,154`),
  segs:[{v:"b",s:[...R(1,10),[452,336],11,[440,316],12,13,14,15]},{v:"s",s:[16,17,[350,186],18,19]}],
  cross:"肩甲骨の上をジグザグに通る"},
 {id:"BL",name:"足の太陽膀胱経",yomi:"あしのたいようぼうこうけい",short:"膀胱経",c:"water",from:"睛明",to:"至陰",
  pts:P(`睛明:せいめい:s:392,134; 攅竹:さんちく:s:392,121; 眉衝:びしょう:s:390,90; 曲差:きょくさ:s:384,84; 五処:ごしょ:s:376,75; 承光:しょうこう:s:360,68; 通天:つうてん:s:342,65; 絡却:らっきゃく:s:320,66; 玉枕:ぎょくちん:s:278,146; 天柱:てんちゅう:s:290,200;
    大杼:だいじょ:b:372.5,274.5; 風門:ふうもん:b:372.5,291; 肺兪:はいゆ:b:372.5,307.5; 厥陰兪:けついんゆ:b:372.5,324; 心兪:しんゆ:b:372.5,340.5; 督兪:とくゆ:b:372.5,357; 膈兪:かくゆ:b:372.5,373.5; 肝兪:かんゆ:b:372.5,406.5; 胆兪:たんゆ:b:372.5,423; 脾兪:ひゆ:b:372.5,439.5; 胃兪:いゆ:b:372.5,456; 三焦兪:さんしょうゆ:b:372.5,472.5; 腎兪:じんゆ:b:372.5,489; 気海兪:きかいゆ:b:372.5,505.5; 大腸兪:だいちょうゆ:b:372.5,522; 関元兪:かんげんゆ:b:372.5,538.5; 小腸兪:しょうちょうゆ:b:372.5,553.5; 膀胱兪:ぼうこうゆ:b:372.5,568.5; 中膂兪:ちゅうりょゆ:b:372.5,583.5; 白環兪:はっかんゆ:b:372.5,598.5;
    上髎:じょうりょう:b:364,556; 次髎:じりょう:b:362,571; 中髎:ちゅうりょう:b:360,586; 下髎:げりょう:b:358,600; 会陽:えよう:b:357,626; 承扶:しょうふ:b:409,672; 殷門:いんもん:b:410,772; 浮郄:ふげき:b:426,888; 委陽:いよう:b:428,905; 委中:いちゅう:b:405,905;
    附分:ふぶん:b:395,291; 魄戸:はっこ:b:395,307.5; 膏肓:こうこう:b:395,324; 神堂:しんどう:b:395,340.5; 譩譆:いき:b:395,357; 膈関:かくかん:b:395,373.5; 魂門:こんもん:b:395,406.5; 陽綱:ようこう:b:395,423; 意舎:いしゃ:b:395,439.5; 胃倉:いそう:b:395,456; 肓門:こうもん:b:395,472.5; 志室:ししつ:b:395,489; 胞肓:ほうこう:b:395,568.5; 秩辺:ちっぺん:b:395,598.5;
    合陽:ごうよう:b:405,933; 承筋:しょうきん:b:405,975; 承山:しょうざん:b:405,1015; 飛揚:ひよう:b:416,1029; 跗陽:ふよう:b:420,1083;
    崑崙:こんろん:s:309,1126; 僕参:ぼくしん:s:306,1156; 申脈:しんみゃく:s:322,1148; 金門:きんもん:s:340,1160; 京骨:けいこつ:s:360,1168; 束骨:そっこつ:s:418,1172; 足通谷:あしのつうこく:s:432,1174; 至陰:しいん:s:443,1177`),
  segs:[{v:"s",s:[...R(1,8),[300,74],[283,104],9,10]},
        {v:"b",s:[...R(11,30),[368,586],31,32,33,34,35,[392,648],36,37,[418,850],38,39,40]},
        {v:"b",s:[...R(41,54),[404,700],[410,850],40]},
        {v:"b",s:[40,55,56,57,58,59]},
        {v:"s",s:R(60,67)}],
  cross:"背部は内側の線（脊柱から1.5寸）と外側の線（3寸）の2本。委中で合流する"},
 {id:"KI",name:"足の少陰腎経",yomi:"あしのしょういんじんけい",short:"腎経",c:"water",from:"湧泉",to:"兪府",
  pts:P(`湧泉:ゆうせん:m:300,1183; 然谷:ねんこく:m:332,1168; 太渓:たいけい:m:388,1121; 大鍾:だいしょう:m:392,1137; 水泉:すいせん:m:386,1149; 照海:しょうかい:m:372,1141; 復溜:ふくりゅう:m:389,1091; 交信:こうしん:m:368,1091; 築賓:ちくひん:m:388,1046; 陰谷:いんこく:m:376,906;
    横骨:おうこつ:f:342,641; 大赫:だいかく:f:342,625; 気穴:きけつ:f:342,609; 四満:しまん:f:342,592; 中注:ちゅうちゅう:f:342,576; 肓兪:こうゆ:f:342,560; 商曲:しょうきょく:f:342,528; 石関:せきかん:f:342,511; 陰都:いんと:f:342,495; 腹通谷:はらのつうこく:f:342,479; 幽門:ゆうもん:f:342,462;
    歩廊:ほろう:f:319,395; 神封:しんぽう:f:319,372; 霊墟:れいきょ:f:319,345; 神蔵:しんぞう:f:319,320; 彧中:いくちゅう:f:319,297; 兪府:ゆふ:f:319,280`),
  segs:[{v:"m",s:[1,2,[372,1128],3,4,5,6,[380,1112],7,8,[380,1066],9,[382,980],10]},{v:"f",s:[...R(11,21),[334,436],...R(22,27)]}],
  cross:"湧泉は足の裏。内果のまわりを太渓→大鍾→水泉→照海と一周する"},
 {id:"PC",name:"手の厥陰心包経",yomi:"てのけっちんしんぽうけい",short:"心包経",c:"fire",from:"天池",to:"中衝",
  pts:P(`天池:てんち:f:273,372; 天泉:てんせん:f:204,375; 曲沢:きょくたく:f:205,470; 郄門:げきもん:f:194,575; 間使:かんし:f:190,605; 内関:ないかん:f:188,620; 大陵:だいりょう:f:184,650; 労宮:ろうきゅう:f:176,684; 中衝:ちゅうしょう:f:178,756`),
  segs:[{v:"f",s:[1,[240,352],2,3,4,5,6,7,8,9]}]},
 {id:"TE",name:"手の少陽三焦経",yomi:"てのしょうようさんしょうけい",short:"三焦経",c:"fire",from:"関衝",to:"糸竹空",
  pts:P(`関衝:かんしょう:b:507,748; 液門:えきもん:b:506,706; 中渚:ちゅうしょ:b:507,690; 陽池:ようち:b:510,652; 外関:がいかん:b:514,620; 支溝:しこう:b:515,605; 会宗:えそう:b:508,598; 三陽絡:さんようらく:b:514,588; 四瀆:しとく:b:508,545; 天井:てんせい:b:500,455; 清冷淵:せいれいえん:b:499,440; 消濼:しょうれき:b:497,402; 臑会:じゅえ:b:500,335; 肩髎:けんりょう:b:492,293; 天髎:てんりょう:b:410,292;
    天牖:てんゆう:s:304,206; 翳風:えいふう:s:316,182; 瘈脈:けいみゃく:s:306,168; 顱息:ろそく:s:306,146; 角孫:かくそん:s:322,121; 耳門:じもん:s:336,146; 和髎:わりょう:s:342,132; 糸竹空:しちくくう:s:368,121`),
  segs:[{v:"b",s:[...R(1,14),[452,280],15]},{v:"s",s:[16,17,18,19,20,[334,128],21,22,23]}],
  cross:"耳の後ろをまわって、耳の前から眉の外端へ"},
 {id:"GB",name:"足の少陽胆経",yomi:"あしのしょうようたんけい",short:"胆経",c:"wood",from:"瞳子髎",to:"足竅陰",
  pts:P(`瞳子髎:どうしりょう:s:370,138; 聴会:ちょうえ:s:334,162; 上関:じょうかん:s:348,140; 頷厭:がんえん:s:362,100; 懸顱:けんろ:s:352,106; 懸釐:けんり:s:342,112; 曲鬢:きょくびん:s:332,120; 率谷:そっこく:s:320,106; 天衝:てんしょう:s:308,100; 浮白:ふはく:s:302,124; 頭竅陰:あたまのきょういん:s:300,150; 完骨:かんこつ:s:304,174;
    本神:ほんじん:s:372,92; 陽白:ようはく:s:378,108; 頭臨泣:あたまのりんきゅう:s:382,84; 目窓:もくそう:s:368,77; 正営:しょうえい:s:352,73; 承霊:しょうれい:s:330,72; 脳空:のうくう:s:282,150; 風池:ふうち:s:290,192;
    肩井:けんせい:s:322,264; 淵腋:えんえき:s:334,372; 輒筋:ちょうきん:s:348,380; 日月:じつげつ:s:386,448; 京門:けいもん:s:314,500; 帯脈:たいみゃく:s:334,560; 五枢:ごすう:s:364,604; 維道:いどう:s:370,614; 居髎:きょりょう:s:346,632; 環跳:かんちょう:s:312,652;
    風市:ふうし:s:338,815; 中瀆:ちゅうとく:s:338,842; 膝陽関:ひざのようかん:s:338,886; 陽陵泉:ようりょうせん:s:342,934; 陽交:ようこう:s:326,1029; 外丘:がいきゅう:s:336,1036; 光明:こうめい:s:338,1057; 陽輔:ようほ:s:338,1071; 懸鍾:けんしょう:s:338,1085; 丘墟:きゅうきょ:s:338,1140; 足臨泣:あしのりんきゅう:s:396,1160; 地五会:ちごえ:s:412,1164; 侠渓:きょうけい:s:428,1170; 足竅陰:あしのきょういん:s:442,1173`),
  // 頭部は3段：耳のまわり（1〜12）→ 外側を回って額へ（12→13）→ 上の段を後ろへ（13〜19）→ 後頭部を下りる。線が交差しない通り道にしている
  segs:[{v:"s",s:[1,2,3,4,5,6,7,8,9,10,11,12,[294,152],[292,120],[304,93],[330,86],[355,85],13,14,15,16,17,18,[304,78],[284,104],[278,130],19,20,[304,232],21,[330,320],22,23,24,[340,476],25,26,27,28,29,30,[322,730],31,32,33,34,[332,982],35,36,37,38,39,40,41,42,43,44]}],
  cross:"頭の側面を3段に往復してから、体の横を下る"},
 {id:"LR",name:"足の厥陰肝経",yomi:"あしのけっちんかんけい",short:"肝経",c:"wood",from:"大敦",to:"期門",
  pts:P(`大敦:だいとん:m:262,1161; 行間:こうかん:m:276,1158; 太衝:たいしょう:m:302,1150; 中封:ちゅうほう:m:348,1124; 蠡溝:れいこう:m:352,1042; 中都:ちゅうと:m:352,1012; 膝関:しつかん:m:372,926; 曲泉:きょくせん:m:368,900; 陰包:いんぽう:m:364,830;
    足五里:あしのごり:f:322,682; 陰廉:いんれん:f:321,668; 急脈:きゅうみゃく:f:311,646; 章門:しょうもん:f:252,520; 期門:きもん:f:288,415`),
  segs:[{v:"m",s:[1,2,3,[328,1138],4,5,6,[364,962],7,8,9]},{v:"f",s:[10,11,12,[272,592],13,14]}]},
 {id:"GV",name:"督脈",yomi:"とくみゃく",short:"督脈",c:"gov",from:"長強",to:"齦交",
  pts:P(`長強:ちょうきょう:b:350,628; 腰兪:ようゆ:b:350,610; 腰陽関:こしのようかん:b:350,530; 命門:めいもん:b:350,497; 懸枢:けんすう:b:350,480; 脊中:せきちゅう:b:350,447; 中枢:ちゅうすう:b:350,431; 筋縮:きんしゅく:b:350,414; 至陽:しよう:b:350,381; 霊台:れいだい:b:350,365; 神道:しんどう:b:350,348; 身柱:しんちゅう:b:350,315; 陶道:とうどう:b:350,282; 大椎:だいつい:b:350,266; 瘂門:あもん:b:350,209; 風府:ふうふ:b:350,198;
    脳戸:のうこ:s:270,150; 強間:きょうかん:s:273,118; 後頂:ごちょう:s:292,79; 百会:ひゃくえ:s:330,59; 前頂:ぜんちょう:s:354,62; 顖会:しんえ:s:374,70; 上星:じょうせい:s:384,79; 神庭:しんてい:s:389,86; 素髎:そりょう:s:407,167; 水溝:すいこう:s:400,179; 兌端:だたん:s:401,188; 齦交:ぎんこう:s:395,184`),
  segs:[{v:"b",s:R(1,16)},{v:"s",s:[...R(17,24),[394,112],[395,128],[400,145],25,26,27,28]}]},
 {id:"CV",name:"任脈",yomi:"にんみゃく",short:"任脈",c:"conc",from:"会陰",to:"承漿",
  pts:P(`会陰:えいん:f:350,674; 曲骨:きょっこつ:f:350,641; 中極:ちゅうきょく:f:350,625; 関元:かんげん:f:350,609; 石門:せきもん:f:350,592; 気海:きかい:f:350,584; 陰交:いんこう:f:350,576; 神闕:しんけつ:f:350,560; 水分:すいぶん:f:350,544; 下脘:げかん:f:350,528; 建里:けんり:f:350,511; 中脘:ちゅうかん:f:350,495; 上脘:じょうかん:f:350,479; 巨闕:こけつ:f:350,462; 鳩尾:きゅうび:f:350,446; 中庭:ちゅうてい:f:350,430;
    膻中:だんちゅう:f:350,372; 玉堂:ぎょくどう:f:350,345; 紫宮:しきゅう:f:350,320; 華蓋:かがい:f:350,297; 璇璣:せんき:f:350,277; 天突:てんとつ:f:350,262; 廉泉:れんせん:f:350,232; 承漿:しょうしょう:f:350,204`),
  segs:[{v:"f",s:R(1,24)}],
  cross:"会陰は外陰部と肛門の間（図では股の下端）"},
];
const EL={metal:"#7D8C9C",earth:"#D9940F",fire:"#E5402B",water:"#3D6FD6",wood:"#2E9E5E",gov:"#8A61CF",conc:"#D2559A"};
const PIVOT={f:350,b:384,s:300,m:360};

// ---------- 状態 ----------
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
const ES=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let root,svg,viewer,mer=MERS[0],view="f",sel=-1,mounted=false,inited=false;
let vb={x:0,y:0,w:700,h:1300},camRaf=0,segLen={},playRaf=0,playing=false,Q=null,labelsOn=true;
const MINW=34;
const viewsOf=m=>[...new Set(m.segs.map(s=>s.v))];
const segPts=s=>s.s.map(x=>Array.isArray(x)?x:mer.pts[x-1].p);
const active=()=>mounted&&!root.hidden&&document.getElementById("play").hidden&&!document.getElementById("scrim");

function mount(){
  root=q("#v-zukan");
  root.innerHTML=`
    <div class="z-top"><div class="z-ttl"><h1>経絡<span>ずかん</span></h1><p>流注を目で追う</p></div>
      <div class="z-mers" id="z-mers" role="group" aria-label="経絡を選ぶ"></div></div>
    <div class="z-viewer" id="z-viewer">
      <svg id="z-fig" class="flowon" viewBox="0 0 700 1300" preserveAspectRatio="xMidYMid meet" role="img" aria-label="経絡の流注図"></svg>
      <div class="z-views" id="z-views" role="group" aria-label="図の向き"></div>
      <div class="z-tgls" id="z-tgls">
        <button class="z-tg" data-t="label" aria-pressed="true"><i></i>名前</button>
        <button class="z-tg" data-t="flow" aria-pressed="true"><i></i>流れ</button>
        <button class="z-tg" data-t="in" aria-pressed="false" id="z-tgIn"><i></i>体内</button>
      </div>
      <div class="z-zbtns" id="z-zbtns"><button id="z-in" aria-label="拡大">＋</button><button id="z-out" aria-label="縮小">−</button><button id="z-fit" class="txt" aria-label="経絡全体を表示">全体</button></div>
      <div class="z-hint" id="z-hint">ピンチで拡大・ドラッグで移動・点をタップ</div>
      <div class="z-xnote" id="z-xnote"></div>
    </div>
    <div class="z-panel" id="z-panel"></div>`;
  svg=q("#z-fig");viewer=q("#z-viewer");
  bindPointer();
  qa(".z-tg",root).forEach(b=>b.onclick=()=>toggle(b));
  q("#z-in").onclick=()=>animateTo(centerOn(vb.x+vb.w/2,vb.y+vb.h/2,vb.w/1.8),260);
  q("#z-out").onclick=()=>animateTo(centerOn(vb.x+vb.w/2,vb.y+vb.h/2,vb.w*1.8),260);
  q("#z-fit").onclick=()=>animateTo(fitRect(focusRect()));
  setTimeout(()=>{const h=q("#z-hint");if(h)h.style.opacity="0";},6000);
  new ResizeObserver(()=>{
    if(!viewer.clientWidth||!viewer.clientHeight)return;
    if(!inited){inited=true;vb=fitRect(focusRect());}
    else{const cx=vb.x+vb.w/2,cy=vb.y+vb.h/2;vb.h=vb.w*aspect();vb.x=cx-vb.w/2;vb.y=cy-vb.h/2;}
    apply();
  }).observe(viewer);
  document.addEventListener("keydown",e=>{
    if(!active())return;
    if(Q){if(Q.kind==="name"&&!Q.revealed&&(e.key===" "||e.key==="Enter")){e.preventDefault();reveal();}return;}
    if(e.key==="ArrowRight")select(Math.min(mer.pts.length-1,sel+1));
    else if(e.key==="ArrowLeft")select(Math.max(0,sel-1));
    else if(e.key===" "){e.preventDefault();playing?stopPlay():startPlay();}
  });
  mounted=true;
  renderMers();renderViews();draw();renderPanel();
}
function show(){if(!mounted)mount();else apply();}

// ---------- 描画 ----------
function draw(){
  const m=mer,v=view;
  const segs=m.segs.map((s,k)=>({...s,k})).filter(s=>s.v===v);
  svg.style.setProperty("--mc",EL[m.c]);
  const inner=m.internal&&m.internal.v===v?m.internal:null;
  const lung="M330,282 C306,282 272,298 264,346 C258,392 258,420 262,440 C292,452 322,450 342,440 L342,300 C342,290 338,282 330,282Z";
  svg.innerHTML=`<g class="figure">${figure(v)}</g>
    ${inner?`<g class="internal"><path class="organ" d="${lung}"/><path class="organ organ-dim" d="${mir(lung)}"/>
      <path class="crease" d="M262,442 C300,428 400,428 438,442"/>
      <path class="organ" d="M362,468 C388,456 420,470 420,500 C420,532 396,548 372,544 C358,541 354,530 364,522 C380,522 392,510 388,496 C384,484 372,482 362,480Z"/>
      <path class="colon" d="M298,640 L298,588 Q298,576 310,576 L390,576 Q402,576 402,588 L402,640"/>
      <path class="inpath" d="${inner.d}"/>${inner.lbls.map(([x,y,a,t])=>`<text class="inlbl" x="${x}" y="${y}" text-anchor="${a}">${ES(t)}</text>`).join("")}</g>`:""}
    ${m.branch&&m.branch.v===v?`<path class="branch" d="${m.branch.d}"/><text class="brlbl" x="${m.branch.lbl[0]}" y="${m.branch.lbl[1]}" text-anchor="${m.branch.lbl[2]}">${ES(m.branch.lbl[3])}</text>`:""}
    ${segs.map(s=>{const d=open(segPts(s));return `<path class="mpath" id="z-seg${s.k}" d="${d}"/><path class="mflow" d="${d}"/>`;}).join("")}
    ${crossMarks(v)}
    <g>${m.pts.map((p,i)=>p.v!==v?"":`<g class="zpt" data-i="${i}"><circle class="halo" cx="${p.p[0]}" cy="${p.p[1]}" r="9"/><circle class="dot" cx="${p.p[0]}" cy="${p.p[1]}" r="4.5"/><text class="lbl" data-x="${p.p[0]}" data-y="${p.p[1]}" data-s="${p.p[0]<PIVOT[v]?-1:1}" text-anchor="${p.p[0]<PIVOT[v]?"end":"start"}">${ES(p.n)}</text></g>`).join("")}</g>
    <circle class="runner" id="z-runner" r="7" cx="0" cy="0" style="display:none"/>`;
  q("#z-tgIn").hidden=!m.internal||!!Q;
  svg.classList.toggle("showin",!!(m.internal&&q("#z-tgIn").getAttribute("aria-pressed")==="true"));
  if(sel>=0)markSel();
  segLen=null;apply();
}
function crossMarks(v){
  let out="";
  mer.segs.forEach((s,k)=>{
    const nx=mer.segs[k+1];if(!nx||s.v!==v||nx.v===v)return;
    const last=s.s[s.s.length-1],p=Array.isArray(last)?last:mer.pts[last-1].p;
    out+=`<g class="xmark" data-go="${nx.v}" data-x="${p[0]}" data-y="${p[1]}"><rect class="xbox"/><text class="xlbl" text-anchor="middle">→ ${VIEWS[nx.v]}へ続く</text></g>`;
  });
  return out;
}

// ---------- ズーム・移動 ----------
const aspect=()=>viewer.clientHeight/Math.max(1,viewer.clientWidth);
const upp=()=>vb.w/Math.max(1,viewer.clientWidth);
function clampVB(t){
  const a=aspect(),B=BOUNDS[view],bw=B[2]-B[0],bh=B[3]-B[1];
  t.w=Math.max(MINW,Math.min(t.w,Math.max(bw,bh/a)*1.08));t.h=t.w*a;
  const cx=Math.max(B[0],Math.min(B[2],t.x+t.w/2)),cy=Math.max(B[1],Math.min(B[3],t.y+t.h/2));
  t.x=cx-t.w/2;t.y=cy-t.h/2;return t;
}
function apply(){
  if(!viewer||!viewer.clientWidth)return;
  clampVB(vb);
  svg.setAttribute("viewBox",`${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);
  const u=upp(),fs=Math.max(2.6,Math.min(14*u,18)),fsi=Math.max(2.4,Math.min(11*u,15)),r=Math.max(1.1,Math.min(5*u,7));
  svg.style.setProperty("--fs",fs+"px");svg.style.setProperty("--fsi",fsi+"px");
  qa(".dot",svg).forEach(c=>c.setAttribute("r",r));qa(".halo",svg).forEach(c=>c.setAttribute("r",r*2.2));
  const off=r*1.7+fs*.15;
  qa(".lbl",svg).forEach(t=>{t.setAttribute("x",+t.dataset.x+off*(+t.dataset.s));t.setAttribute("y",+t.dataset.y+fs*.35);});
  qa(".xmark",svg).forEach(g=>{
    const x=+g.dataset.x,y=+g.dataset.y,w=fsi*7.4,h=fsi*1.7,bx=x+r*2,by=y-h-r*2,rc=g.querySelector("rect"),tx=g.querySelector("text");
    rc.setAttribute("x",bx);rc.setAttribute("y",by);rc.setAttribute("width",w);rc.setAttribute("height",h);rc.setAttribute("rx",h/2);
    tx.setAttribute("x",bx+w/2);tx.setAttribute("y",by+h*.68);
  });
  const rn=q("#z-runner");if(rn)rn.setAttribute("r",r*1.5);
}
function fitRect([x0,y0,x1,y1],pad=0.08){
  const a=aspect(),cx=(x0+x1)/2,cy=(y0+y1)/2,w0=Math.max(60,x1-x0)*(1+pad*2),h0=Math.max(60,y1-y0)*(1+pad*2),w=Math.max(w0,h0/a);
  return {x:cx-w/2,y:cy-w*a/2,w,h:w*a};
}
function focusRect(){
  const ps=mer.pts.filter(p=>p.v===view).map(p=>p.p);if(!ps.length)return BOUNDS[view];
  const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]);
  return [Math.min(...xs)-40,Math.min(...ys)-30,Math.max(...xs)+40,Math.max(...ys)+30];
}
function animateTo(t,dur=420){
  cancelAnimationFrame(camRaf);clampVB(t);const s={...vb},t0=performance.now();
  const step=now=>{const k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3);
    vb={x:s.x+(t.x-s.x)*e,y:s.y+(t.y-s.y)*e,w:s.w+(t.w-s.w)*e,h:s.h+(t.h-s.h)*e};apply();if(k<1)camRaf=requestAnimationFrame(step);};
  camRaf=requestAnimationFrame(step);
}
function toUnits(cx,cy){const r=viewer.getBoundingClientRect(),u=upp();return [vb.x+(cx-r.left)*u,vb.y+(cy-r.top)*u];}
function zoomAt(cx,cy,f){const r=viewer.getBoundingClientRect(),[ux,uy]=toUnits(cx,cy),w=Math.max(MINW,vb.w*f),u=w/viewer.clientWidth;vb={x:ux-(cx-r.left)*u,y:uy-(cy-r.top)*u,w,h:w*aspect()};apply();}
const centerOn=(x,y,w)=>({x:x-w/2,y:y-w*aspect()/2,w,h:w*aspect()});
function bindPointer(){
  const ptrs=new Map();let lastTap=0,pinch=null;
  qa("#z-zbtns,#z-tgls,#z-views",root).forEach(el=>el.addEventListener("pointerdown",e=>e.stopPropagation()));
  viewer.addEventListener("pointerdown",e=>{
    cancelAnimationFrame(camRaf);stopPlay();const h=q("#z-hint");if(h)h.style.opacity="0";
    try{viewer.setPointerCapture(e.pointerId);}catch(_){}
    ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t:performance.now()});
    if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2};}
  });
  viewer.addEventListener("pointermove",e=>{
    const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(ptrs.size===1){const u=upp();vb.x-=dx*u;vb.y-=dy*u;apply();}
    else if(ptrs.size===2&&pinch){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,u=upp();
      vb.x-=(mx-pinch.mx)*u;vb.y-=(my-pinch.my)*u;zoomAt(mx,my,pinch.d/Math.max(1,d));pinch={d,mx,my};}
  });
  const end=e=>{
    const p=ptrs.get(e.pointerId);if(!p)return;
    const moved=Math.hypot(e.clientX-p.x0,e.clientY-p.y0),dt=performance.now()-p.t,single=ptrs.size===1&&!pinch;
    ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;
    if(!(single&&moved<8&&dt<450&&e.type==="pointerup"))return;
    const [ux,uy]=toUnits(e.clientX,e.clientY);
    for(const g of qa(".xmark",svg)){const b=g.getBBox();if(ux>=b.x-4&&ux<=b.x+b.width+4&&uy>=b.y-4&&uy<=b.y+b.height+4){goView(g.dataset.go,true);return;}}
    let best=-1,bd=1e9;
    mer.pts.forEach((pt,i)=>{if(pt.v!==view)return;const d=Math.hypot(pt.p[0]-ux,pt.p[1]-uy);if(d<bd){bd=d;best=i;}});
    if(best>=0&&bd<(Q?26:20)*upp()){lastTap=0;if(Q)answerWhere(best);else select(best,{cam:false});return;}
    const now=performance.now();
    if(now-lastTap<320){animateTo(centerOn(ux,uy,Math.max(MINW,vb.w/2.2)));lastTap=0;}else lastTap=now;
  };
  viewer.addEventListener("pointerup",end);viewer.addEventListener("pointercancel",end);
  viewer.addEventListener("wheel",e=>{e.preventDefault();cancelAnimationFrame(camRaf);zoomAt(e.clientX,e.clientY,Math.exp(e.deltaY*0.0016));},{passive:false});
}
let xT=0;function xnote(t){const n=q("#z-xnote");n.textContent=t;n.classList.add("on");clearTimeout(xT);xT=setTimeout(()=>n.classList.remove("on"),2200);}

// ---------- 向き・経絡の切り替え ----------
function goView(v,fit){
  if(v===view){if(fit)animateTo(fitRect(focusRect()));return;}
  view=v;svg.classList.add("swap");renderViews();
  setTimeout(()=>{draw();if(fit)vb=fitRect(focusRect());apply();svg.classList.remove("swap");},120);
}
function setView(v){if(v!==view){view=v;renderViews();draw();}}
function renderViews(){
  const vs=viewsOf(mer),el=q("#z-views");
  el.innerHTML=vs.map(v=>`<button data-v="${v}" aria-pressed="${v===view}">${VIEWS[v]}</button>`).join("");
  el.hidden=vs.length<2;
  qa("button",el).forEach(b=>b.onclick=()=>{stopPlay();goView(b.dataset.v,true);});
}
function renderMers(){
  const el=q("#z-mers");
  el.innerHTML=MERS.map(m=>`<button class="z-mer" data-m="${m.id}" style="--c:${EL[m.c]}" aria-pressed="${m===mer}"><i></i>${m.short}</button>`).join("");
  qa(".z-mer",el).forEach(b=>b.onclick=()=>{if(!Q)setMer(b.dataset.m);});
}
function setMer(id){
  stopPlay();mer=MERS.find(m=>m.id===id)||MERS[0];sel=-1;view=viewsOf(mer)[0];
  qa(".z-mer",root).forEach(b=>b.setAttribute("aria-pressed",b.dataset.m===mer.id));
  const b=q(`.z-mer[data-m="${mer.id}"]`,root);if(b)b.scrollIntoView({inline:"center",block:"nearest"});
  renderViews();draw();vb=fitRect(focusRect());apply();renderPanel();
}

// ---------- 下のパネル（見る／練習） ----------
function renderPanel(){
  const el=q("#z-panel");
  if(Q){renderQuiz();return;}
  el.innerHTML=`<div class="z-info" id="z-info"></div>
    <div class="z-row"><button class="z-play" id="z-play">▶ 流注を再生</button><div class="z-chips" id="z-chips" role="group" aria-label="経穴を選ぶ"></div></div>`;
  q("#z-play").onclick=()=>playing?stopPlay():startPlay();
  q("#z-chips").innerHTML=mer.pts.map((p,i)=>`<button class="z-chip" data-i="${i}" aria-pressed="${i===sel}"><small>${i+1}</small>${ES(p.n)}</button>`).join("");
  qa(".z-chip",el).forEach(b=>b.onclick=()=>{stopPlay();select(+b.dataset.i);});
  renderInfo();
}
function renderInfo(){
  const el=q("#z-info");if(!el)return;const m=mer;
  if(sel<0){
    el.innerHTML=`<div class="z-code"><small>${m.id}</small><b>${m.pts.length}</b></div>
      <div class="z-nm"><div class="big" style="font-size:21px"><ruby>${ES(m.name)}<rt>${ES(m.yomi)}</rt></ruby></div><div class="sub">${m.pts.length}穴 · ${m.from} から ${m.to} へ${m.cross?` · ${ES(m.cross)}`:""}</div></div>
      <div class="z-nav"><button id="z-nx" aria-label="最初の経穴へ">▶</button></div>`;
    q("#z-nx").onclick=()=>select(0);return;
  }
  const p=m.pts[sel],pv=m.pts[sel-1],nx=m.pts[sel+1];
  el.innerHTML=`<div class="z-code"><small>${m.id}</small><b>${sel+1}</b></div>
    <div class="z-nm"><div class="big"><ruby>${ES(p.n)}<rt>${ES(p.y)}</rt></ruby></div>
      <div class="sub"><em>${VIEWS[p.v]}</em>${sel+1} / ${m.pts.length}　${pv?`${ES(pv.n)} ← `:""}<b>${ES(p.n)}</b>${nx?` → ${ES(nx.n)}`:""}</div></div>
    <div class="z-nav"><button id="z-pv" aria-label="前の経穴" ${pv?"":"disabled"}>◀</button><button id="z-nx" aria-label="次の経穴" ${nx?"":"disabled"}>▶</button></div>`;
  q("#z-pv").onclick=()=>{stopPlay();select(sel-1);};q("#z-nx").onclick=()=>{stopPlay();select(sel+1);};
}
function markSel(){qa(".zpt",svg).forEach(g=>g.classList.toggle("sel",+g.dataset.i===sel));const g=q(`.zpt[data-i="${sel}"]`,svg);if(g)g.parentNode.appendChild(g);}
function zoomWidthFor(i){const p=mer.pts[i];let d=1e9;mer.pts.forEach((o,j)=>{if(j!==i&&o.v===p.v)d=Math.min(d,Math.hypot(o.p[0]-p.p[0],o.p[1]-p.p[1]));});return Math.max(70,Math.min(260,d*11));}
function select(i,{cam=true}={}){
  sel=i;
  if(i>=0&&mer.pts[i].v!==view){setView(mer.pts[i].v);const p=mer.pts[i].p;vb=clampVB(centerOn(p[0],p[1],zoomWidthFor(i)));apply();if(!Q)xnote(`${VIEWS[view]}の図に切り替えました`);cam=false;}
  markSel();
  qa(".z-chip",root).forEach(b=>b.setAttribute("aria-pressed",+b.dataset.i===i));
  const c=q(`.z-chip[data-i="${i}"]`,root);if(c)c.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"});
  renderInfo();
  if(cam&&i>=0){const p=mer.pts[i].p;animateTo(centerOn(p[0],p[1],zoomWidthFor(i)));}
}

// ---------- 流注の再生 ----------
// 再生するときだけ、表示中の向きの線について「各経穴が線の何番目の長さにあるか」を計算する。
// 経穴は曲線のつなぎ目にあるので、曲線ごとの長さを足していくだけで済む（以前は線を数千点たどっていて胆経が重かった）
function measure(){
  segLen={};
  mer.segs.forEach((s,k)=>{
    if(s.v!==view)return;
    const path=q(`#z-seg${k}`,svg);if(!path)return;
    const cum=[0];for(const c of curves(segPts(s)))cum.push(cum[cum.length-1]+cubicLen(c));
    const L=path.getTotalLength(),sc=L/(cum[cum.length-1]||1);
    const marks=[];s.s.forEach((x,j)=>{if(!Array.isArray(x))marks.push([cum[j]*sc,x-1]);});
    segLen[k]={L,marks};
  });
}
function startPlay(){
  stopPlay();playing=true;const pb=q("#z-play");if(pb)pb.textContent="❚❚ 一時停止";
  let k=0;select(-1,{cam:false});
  const run=()=>{
    if(!playing)return;
    if(k>=mer.segs.length){stopPlay();animateTo(fitRect(focusRect()),700);return;}
    const s=mer.segs[k];if(s.v!==view){setView(s.v);xnote(`${VIEWS[view]}の図へ`);}
    if(!segLen||!segLen[k])measure();
    const path=q(`#z-seg${k}`,svg),rn=q("#z-runner"),info=segLen[k];if(!path||!info){k++;run();return;}
    const L=info.L,dur=Math.max(1500,L*11),t0=performance.now();let passed=-1;
    const xs=segPts(s),w0=Math.max(...xs.map(p=>p[0]))-Math.min(...xs.map(p=>p[0])),h0=Math.max(...xs.map(p=>p[1]))-Math.min(...xs.map(p=>p[1]));
    const camW=Math.max(90,Math.min(240,Math.max(w0,h0)*0.55));
    const step=now=>{
      if(!playing)return;
      const f=Math.min(1,(now-t0)/dur),t=f*L,pt=path.getPointAtLength(t);
      rn.style.display="";rn.setAttribute("cx",pt.x);rn.setAttribute("cy",pt.y);
      const tg=clampVB(centerOn(pt.x,pt.y,camW));
      vb={x:vb.x+(tg.x-vb.x)*.12,y:vb.y+(tg.y-vb.y)*.12,w:vb.w+(tg.w-vb.w)*.12,h:vb.h+(tg.h-vb.h)*.12};apply();
      while(passed+1<info.marks.length&&info.marks[passed+1][0]<=t+0.5){passed++;select(info.marks[passed][1],{cam:false});}
      if(f<1)playRaf=requestAnimationFrame(step);else{k++;run();}
    };
    playRaf=requestAnimationFrame(step);
  };
  run();
}
function stopPlay(){
  if(!playing)return;playing=false;cancelAnimationFrame(playRaf);
  const pb=q("#z-play");if(pb)pb.textContent="▶ 流注を再生";const rn=q("#z-runner");if(rn)rn.style.display="none";
}
function toggle(b){
  const on=b.getAttribute("aria-pressed")!=="true";b.setAttribute("aria-pressed",on);const t=b.dataset.t;
  if(t==="label"){labelsOn=on;svg.classList.toggle("nolabel",!on);}
  if(t==="flow")svg.classList.toggle("flowon",on);
  if(t==="in"&&mer.internal){stopPlay();setView(mer.internal.v);svg.classList.toggle("showin",on);animateTo(fitRect(on?mer.internal.fit:focusRect()),600);}
}

// ---------- 練習：場所あて（名前→図の点をタップ）／名前あて（光った点→名前を思い出す） ----------
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function startQuiz(kind,id,only){
  if(!mounted)mount();
  stopPlay();setMer(id);
  const order=only&&only.length?shuffle(only):shuffle(mer.pts.map((_,i)=>i));
  Q={kind,id,order,k:0,correct:0,misses:[],t0:performance.now(),answered:false,revealed:false};
  svg.classList.add("nolabel","quiz");q("#z-tgIn").hidden=true;
  qa(".z-mer",root).forEach(b=>b.disabled=true);
  ask();
}
function ask(){
  if(Q.k>=Q.order.length){finishQuiz();return;}
  const i=Q.order[Q.k];Q.answered=false;Q.revealed=false;
  qa(".zpt",svg).forEach(g=>g.classList.remove("ok","ng"));
  if(Q.kind==="where"){
    sel=-1;markSel();
    const v=mer.pts[i].v;if(v!==view){setView(v);vb=fitRect(focusRect());apply();xnote(`${VIEWS[view]}の図から探そう`);}
  }else{
    svg.classList.add("hidesel");select(i);
  }
  renderQuiz();
}
function renderQuiz(){
  const el=q("#z-panel"),i=Q.order[Q.k],p=mer.pts[i]||{},n=Q.order.length,done=Math.min(Q.k,n);
  let body;
  if(Q.kind==="where"){
    body=Q.answered?Q.lastOk?`<div class="z-qname ok"><ruby>${ES(p.n)}<rt>${ES(p.y)}</rt></ruby></div><p class="z-qhint ok">○ 正解！</p>`
      :`<div class="z-qname"><ruby>${ES(p.n)}<rt>${ES(p.y)}</rt></ruby></div><p class="z-qhint ng">✕ 光っている点が正解</p>`
      :`<div class="z-qname"><ruby>${ES(p.n)}<rt>${ES(p.y)}</rt></ruby></div><p class="z-qhint">この経穴はどこ？ 図の点をタップ</p>`;
  }else{
    body=Q.revealed?`<div class="z-qname"><ruby>${ES(p.n)}<rt>${ES(p.y)}</rt></ruby></div>
      <div class="z-judge"><button class="btn-s" id="z-ng">✕ まだ</button><button class="btn-p" id="z-ok">○ 言えた</button></div>`
      :`<div class="z-qname q">？</div><button class="btn-p z-reveal" id="z-reveal">名前を思い浮かべてから　答えを見る</button>`;
  }
  el.innerHTML=`<div class="z-quiz">
    <div class="z-qhead"><span class="z-qtag">${Q.kind==="where"?"場所あて":"名前あて"}</span><b>${ES(mer.short)}</b><span class="z-qprog">${Math.min(Q.k+1,n)} / ${n}</span><span class="z-qscore">○ ${Q.correct}</span><button class="z-qquit" id="z-qquit">やめる</button></div>
    <div class="z-qbar"><i style="width:${done/n*100}%"></i></div>
    <div class="z-qbody">${body}</div></div>`;
  q("#z-qquit").onclick=()=>endQuiz();
  const rv=q("#z-reveal");if(rv)rv.onclick=reveal;
  const ok=q("#z-ok");if(ok)ok.onclick=()=>judge(true);
  const ng=q("#z-ng");if(ng)ng.onclick=()=>judge(false);
}
function answerWhere(j){
  if(!Q||Q.kind!=="where"||Q.answered)return;
  const i=Q.order[Q.k];Q.answered=true;Q.lastOk=(i===j);
  const gj=q(`.zpt[data-i="${j}"]`,svg);
  if(Q.lastOk){Q.correct++;if(gj)gj.classList.add("ok");sfx.pop();buzz(10);}
  else{Q.misses.push(i);if(gj)gj.classList.add("ng");sfx.sad();buzz([30,40,30]);sel=i;markSel();
    const p=mer.pts[i].p;animateTo(centerOn(p[0],p[1],Math.max(vb.w*0.8,zoomWidthFor(i))),350);}
  renderQuiz();
  setTimeout(()=>{if(Q){Q.k++;ask();}},Q.lastOk?650:1600);
}
function reveal(){if(!Q||Q.revealed)return;Q.revealed=true;svg.classList.remove("hidesel");swish();renderQuiz();}
function judge(ok){
  if(!Q)return;const i=Q.order[Q.k];
  if(ok){Q.correct++;sfx.pop();}else{Q.misses.push(i);buzz(20);}
  Q.k++;ask();
}
function endQuiz(){
  Q=null;svg.classList.remove("quiz","hidesel");svg.classList.toggle("nolabel",!labelsOn);
  qa(".z-mer",root).forEach(b=>b.disabled=false);
  qa(".zpt",svg).forEach(g=>g.classList.remove("ok","ng"));
  q("#z-tgIn").hidden=!mer.internal;sel=-1;markSel();renderPanel();animateTo(fitRect(focusRect()));
}
function finishQuiz(){
  const sec=(performance.now()-Q.t0)/1000,n=Q.order.length,{kind,id,correct}=Q,misses=[...new Set(Q.misses)];
  const l={t:Date.now(),mode:"zukan",kind,ids:[id],total:n,correct,sec:Math.round(sec),misses:misses.map(i=>mer.pts[i].n)};
  store.logs.unshift(l);store.logs=store.logs.slice(0,400);save();
  const perfect=correct===n;
  const sc=openSheet(`<div class="rr"><div class="mas">${tsubo(perfect?"happy":correct>=n*0.7?"normal":"sad")}</div>
      <h3 class="${perfect?"ok":""}">${perfect?"全問正解！":`${correct} / ${n} 正解`}</h3>
      <p>${kind==="where"?"場所あて":"名前あて"} · ${ES(mer.name)} · ${fmt(sec)}</p></div>
    ${misses.length?`<div><p class="label">まちがえた経穴</p><div class="chain">${misses.map(i=>`<span class="no">${ES(mer.pts[i].n)}</span>`).join("")}</div></div>`:""}
    <div class="actions">
      ${misses.length?`<button class="btn-p" id="zq-miss">まちがえた ${misses.length}穴だけ もう一度</button>`:""}
      <button class="${misses.length?"btn-s":"btn-p"}" id="zq-again">もう一度（全部）</button>
      <button class="btn-s" id="zq-back">ずかんに戻る</button></div>`,true);
  if(perfect){setTimeout(()=>{confetti();sfx.fanfare();},200);}
  const mm=q("#zq-miss",sc);if(mm)mm.onclick=()=>{closeSheet();startQuiz(kind,id,misses);};
  q("#zq-again",sc).onclick=()=>{closeSheet();startQuiz(kind,id);};
  q("#zq-back",sc).onclick=()=>{closeSheet();endQuiz();};
  Q.k=Q.order.length;
}

return {show,startQuiz,list:()=>MERS.map(m=>({id:m.id,short:m.short,color:EL[m.c],n:m.pts.length})),data:MERS};
})();
