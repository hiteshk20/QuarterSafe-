/** QUARANTIN — Yearly dashboard + Canvas chart. */
const Dashboard = {
  resizeHandler:null,

  /**
   * Render everything.
   * @returns {void}
   * @example Dashboard.renderDashboard()
   */
  renderDashboard(){
    Storage.getAllPayments().then(ps=>{
      if(ps.length===0){this.kpis({totalGross:0,totalTax:0,totalNet:0});return;}
      Storage.getYTDTotals().then(t=>{
        this.kpis(t);
        this.stats(ps);
        this.chart(this.groupByMonth(ps));
      });
    });
  },

  /**
   * Render KPI cards.
   * @param {Object} t - totals
   * @returns {void}
   * @example Dashboard.kpis(totals)
   */
  kpis(t){
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=formatCurrency(v);};
    set('kpi-gross',t.totalGross);set('kpi-tax',t.totalTax);set('kpi-net',t.totalNet);
    const r=document.getElementById('kpi-rate');
    if(r)r.textContent=formatPercentage(t.totalGross>0?t.totalTax/t.totalGross:0);
  },

  /**
   * Render highest/lowest stats.
   * @param {Array} ps
   * @returns {void}
   */
  stats(ps){
    const hi=ps.reduce((m,p)=>p.totalTax>m.totalTax?p:m,ps[0]);
    const lo=ps.reduce((m,p)=>p.totalTax<m.totalTax?p:m,ps[0]);
    const h=document.getElementById('stat-highest'),l=document.getElementById('stat-lowest');
    if(h)h.textContent=formatCurrency(hi.totalTax)+' · '+formatDate(hi.date);
    if(l)l.textContent=formatCurrency(lo.totalTax)+' · '+formatDate(lo.date);
  },

  /**
   * Group payments into 12 monthly buckets.
   * @param {Array} ps
   * @returns {Array<Object>}
   * @example Dashboard.groupByMonth(payments)
   */
  groupByMonth(ps){
    const names=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data=names.map((m,i)=>({month:m,i,gross:0,tax:0,net:0}));
    const year=getCurrentYear();
    ps.forEach(p=>{
      const d=new Date(p.date);
      if(d.getFullYear()!==year)return;
      const b=data[d.getMonth()];
      b.gross+=p.gross||0;b.tax+=p.totalTax||0;b.net+=p.netTakeHome||0;
    });
    return data;
  },

  /**
   * Draw grouped bar chart (responsive).
   * @param {Array<Object>} data
   * @returns {void}
   * @example Dashboard.chart(monthlyData)
   */
  chart(data){
    const canvas=document.getElementById('ytd-chart');
    if(!canvas)return;
    if(this.resizeHandler)window.removeEventListener('resize',this.resizeHandler);
    const draw=()=>{
      const ctx=canvas.getContext('2d');if(!ctx)return;
      const w=canvas.parentElement.clientWidth-32;
      const h=280;const dpr=window.devicePixelRatio||1;
      canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';
      ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
      const st=getComputedStyle(document.documentElement);
      const txt=st.getPropertyValue('--color-text-secondary').trim()||'#94A3B8';
      const grid=st.getPropertyValue('--color-border-primary').trim()||'#1E3A5F';
      const cG=st.getPropertyValue('--color-accent-secondary').trim()||'#0EA5E9';
      const cT=st.getPropertyValue('--color-accent-danger').trim()||'#FF4D6D';
      const cN=st.getPropertyValue('--color-accent-success').trim()||'#10B981';
      const pad={t:36,r:12,b:40,l:48};
      const cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
      const max=Math.max(...data.map(d=>Math.max(d.gross,d.tax,d.net)),1);
      ctx.strokeStyle=grid;ctx.lineWidth=0.5;ctx.font='10px monospace';ctx.fillStyle=txt;
      for(let i=0;i<=4;i++){
        const y=pad.t+ch/4*i;
        ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();
        ctx.textAlign='right';ctx.fillText(this.short(max-max/4*i),pad.l-6,y+3);
      }
      const gw=cw/12,bw=Math.min(gw*0.22,18),gap=2;
      data.forEach((d,i)=>{
        const x=pad.l+gw*i+gw*0.15;
        const gh=d.gross/max*ch,th=d.tax/max*ch,nh=d.net/max*ch;
        ctx.fillStyle=cG;ctx.fillRect(x,pad.t+ch-gh,bw,gh);
        ctx.fillStyle=cT;ctx.fillRect(x+bw+gap,pad.t+ch-th,bw,th);
        ctx.fillStyle=cN;ctx.fillRect(x+(bw+gap)*2,pad.t+ch-nh,bw,nh);
        ctx.fillStyle=txt;ctx.textAlign='center';ctx.font='10px sans-serif';
        ctx.fillText(d.month,pad.l+gw*i+gw/2,h-pad.b+14);
      });
      let lx=pad.l;ctx.font='11px sans-serif';
      [['Gross',cG],['Tax',cT],['Net',cN]].forEach(([label,color])=>{
        ctx.fillStyle=color;ctx.fillRect(lx,8,12,12);
        ctx.fillStyle=txt;ctx.textAlign='left';ctx.fillText(label,lx+16,18);
        lx+=ctx.measureText(label).width+36;
      });
    };
    draw();
    this.resizeHandler=debounce(draw,200);
    window.addEventListener('resize',this.resizeHandler);
  },

  /**
   * Short currency for axes.
   * @param {number} v
   * @returns {string}
   * @example Dashboard.short(5000) → "$5K"
   */
  short(v){
    if(v>=1e6)return '$'+(v/1e6).toFixed(1)+'M';
    if(v>=1e3)return '$'+(v/1e3).toFixed(0)+'K';
    return '$'+v.toFixed(0);
  }
};
