import e from"dayjs";import n from"dayjs/plugin/weekOfYear";import r from"dayjs/plugin/weekday";var t;e.extend(n),e.extend(r),function(e){e[e.Year=0]="Year",e[e.Month=1]="Month",e[e.Day=2]="Day",e[e.Hour=3]="Hour",e[e.Min=4]="Min",e[e.Sec=5]="Sec",e[e.WeekOfYear=6]="WeekOfYear",e[e.Weekday=7]="Weekday",e[e.WeekOfMonth=8]="WeekOfMonth"}(t||(t={}));const a={[t.Year]:void 0,[t.Month]:[1,12],[t.Day]:[1,31],[t.Hour]:[0,23],[t.Min]:[0,59],[t.Sec]:[0,59],[t.WeekOfYear]:[1,52],[t.WeekOfMonth]:[1,4],[t.Weekday]:[0,6]};function s(e,n){return"*"===e?[]:e.split(",").map(e=>{const[r,t]=e.split("-"),s=parseInt(r),o=parseInt(t);if(!function(e,n,r){if(isNaN(e)||isNaN(n))return!1;const t=a[r];if(null==t)return!0;const[s,o]=t;return e>=s&&n<=o}(s,o,n))throw new Error(`Invalid range ${s}-${o} in`);return{start:s,end:o}})}function o(e){const{period:n,year:r,month:a,weekOfYear:o,weekOfMonth:i,weekday:c,day:u,hour:h,min:d,sec:f}=e;return{period:n,year:s(r,t.Year),month:null!=a?s(a,t.Month):void 0,weekOfYear:null!=o?s(o,t.WeekOfYear):void 0,weekOfMonth:null!=i?s(i,t.WeekOfMonth):void 0,weekday:null!=c?s(c,t.Weekday):void 0,day:null!=u?s(u,t.Day):void 0,hour:s(h,t.Hour),min:s(d,t.Min),sec:s(f,t.Sec)}}function i(e,n,r,a){const s=a?r.start:r.end;switch(n){case t.Sec:return e.second(s);case t.Min:return e.minute(s);case t.Hour:return e.hour(s);case t.Day:return e.date(s);case t.Weekday:return e.weekday(s);case t.WeekOfMonth:const n=e.weekday();return e.startOf("month").week(s).weekday(n);case t.WeekOfYear:return e.week(s);case t.Month:return e.month(s);case t.Year:return e.year(s)}}function c(e,n){let r=0,t=!1;for(let a=0;a<n.length;a++){r=a;const s=n[a],o=n[a-1];if(e>=s.start&&e<=s.end){t=!0;break}if(null!=o&&e>o.end&&e<s.start)break}return{rangeIndex:r,inRange:t}}function u(e,n,r,a,s,o){const{weekOfMonth:c,day:u}=r,h=a[s+1];if(null!=h)return i(n,e,h,o);{let s;switch(e){case t.Sec:s=t.Min;break;case t.Min:s=t.Hour;break;case t.Hour:s=null!=u?t.Day:t.Weekday;break;case t.Day:s=t.Month;break;case t.Weekday:s=null!=c?t.WeekOfMonth:t.WeekOfYear;break;case t.WeekOfMonth:case t.WeekOfYear:case t.Month:s=t.Year;break;case t.Year:return null}if(s){const t=d(s,n,r,o),c=o?a[0]:a[a.length-1];if(null!=t&&c)return i(t,e,c,o)}}return null}function h(e,n){switch(n){case t.Sec:return e.second();case t.Min:return e.minute();case t.Hour:return e.hour();case t.Day:return e.date();case t.Weekday:return e.weekday();case t.WeekOfMonth:return parseInt(e.format("w"))-parseInt(e.startOf("M").format("w"))+1;case t.WeekOfYear:return e.week();case t.Month:return e.month();case t.Year:return e.year()}}function d(e,n,r,a=!0){let s=n;const{period:o}=r,i=h(n,e),d=function(e,n){const{year:r,month:a,weekOfYear:s,weekOfMonth:o,weekday:i,day:c,hour:u,min:h,sec:d}=e;switch(n){case t.Sec:return d;case t.Min:return h;case t.Hour:return u;case t.Day:return c;case t.Weekday:return i;case t.WeekOfMonth:return o;case t.WeekOfYear:return s;case t.Month:return a;case t.Year:return r}}(r,e);if(d&&d.length){const{rangeIndex:f,inRange:k}=c(i,d);if(k){const{periodNumber:i,opUnit:f}=function(e,n){const[r,a=""]=e.replace("P","").split("T");let s,o;switch(n){case t.Sec:s=a.match(/(\d+)[s]/i),o="second";break;case t.Min:s=a.match(/(\d+)[m]/i),o="minute";break;case t.Hour:s=a.match(/(\d+)[h]/i),o="hour";break;case t.Day:case t.Weekday:case t.WeekOfMonth:case t.WeekOfYear:s=r.match(/(\d+)[d]/i),o="day";break;case t.Month:s=r.match(/(\d+)[m]/i),o="month";break;case t.Year:s=r.match(/(\d+)[y]/i),o="year"}return s?{periodNumber:parseInt(s[1]),opUnit:o}:{periodNumber:NaN,opUnit:o}}(o,e);s=a?n.add(i,f):n.subtract(i,f);const k=h(s,e),{rangeIndex:l,inRange:y}=c(k,d);y||(s=u(e,s,r,d,l,a))}else s=u(e,n,r,d,f,a)}return s}class f{constructor(n,r){this.hasPrev=!0,this.hasNext=!0,this.options=n,this.originalTimestamp=r,this.currentTime=e.unix(r)}reset(){this.currentTime=e.unix(this.originalTimestamp)}prev(){if(!this.hasPrev)return null;const e=d(t.Sec,this.currentTime,this.options);return this.hasPrev=null!=e,null!=e&&(this.currentTime=e),e}next(){if(!this.hasNext)return null;const e=d(t.Sec,this.currentTime,this.options,!0);return this.hasNext=null!=e,null!=e&&(this.currentTime=e),e}}function k(e,n){const r=e.split(" ");let t;if(function(e){return-1!==e.indexOf("/")}(e))if(function(e){return 5===e.length}(r)){const[e,n,a,s,i,c]=r,[u,h]=a.split("/");t=o({period:e,year:n,weekOfYear:u,weekday:h,hour:s,min:i,sec:c})}else{const[e,n,a,s,i,c,u]=r,[h,d]=s.split("/");t=o({period:e,year:n,month:a,weekOfMonth:h,weekday:d,hour:i,min:c,sec:u})}else{const[n,r,a,s,i,c,u]=e.split(" ");t=o({period:n,year:r,month:a,day:s,hour:i,min:c,sec:u})}return new f(t,n)}export{k as parseExpression};
//# sourceMappingURL=index.modern.js.map
