/* Export local : aucune donnée envoyée à un fournisseur d’agenda. */
globalThis.SalonCalendar = (() => {
  const escape = value => String(value || '').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const stamp = value => new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  function fold(line) {
    const encoder=new TextEncoder();let output='',part='',size=0;
    for(const char of line){const length=encoder.encode(char).length;if(size+length>75){output+=part+'\r\n';part=' ';size=1;}part+=char;size+=length;}
    return output+part;
  }
  function create(item, twitch, now=new Date()) {
    const url=/^[a-zA-Z0-9_]{3,25}$/.test(twitch)?'https://www.twitch.tv/'+twitch:'';
    const description=[item.game,item.description,url,'Rendez-vous importé : les changements du site ne sont pas synchronisés automatiquement.'].filter(Boolean).join('\n');
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Herxing//Rendez-vous//FR','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+escape(item.id)+'@herxing-site','DTSTAMP:'+stamp(now),'DTSTART:'+stamp(item.start),'DTEND:'+stamp(item.end),'SUMMARY:'+escape(item.title),'DESCRIPTION:'+escape(description),'STATUS:'+(item.status==='cancelled'?'CANCELLED':item.status==='postponed'?'TENTATIVE':'CONFIRMED'),...(url?['URL:'+url]:[]),'END:VEVENT','END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
  }
  return {create};
})();
