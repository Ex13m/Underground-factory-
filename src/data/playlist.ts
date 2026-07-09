/** Плейлист микро-плеера: треки из public/media/music (см. fx/MicroPlayer).
 *  v0.23.0: каталог заменён финальными полными версиями (из WAV владельца,
 *  конвертация lame V2); нарезки boost-a/b/c/d и пр. сняты с эфира. */

export interface Track {
  title: string;
  url: string;
}

export const PLAYLIST: Track[] = [
  { title: 'BLACKTOP', url: '/media/music/blacktop.mp3' },
  { title: 'BOOST', url: '/media/music/boost.mp3' },
  { title: 'DYNO', url: '/media/music/dyno.mp3' },
  { title: 'LAUNCH CONTROL', url: '/media/music/launch-control.mp3' },
  { title: 'NIGHT SHIFT', url: '/media/music/night-shift.mp3' },
  { title: 'NITROUS', url: '/media/music/nitrous-a.mp3' },
  { title: 'NITROUS ▸ II', url: '/media/music/nitrous-b.mp3' },
  { title: 'OVERSTEER', url: '/media/music/oversteer.mp3' },
  { title: 'REDLINE', url: '/media/music/redline.mp3' },
  { title: 'TUNNEL', url: '/media/music/tunnel.mp3' },
  { title: 'WIDEBODY', url: '/media/music/widebody.mp3' },
];
