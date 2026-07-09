/** Плейлист микро-плеера: треки из public/media/music (см. fx/MicroPlayer). */

export interface Track {
  title: string;
  url: string;
}

export const PLAYLIST: Track[] = [
  { title: 'BOOST', url: '/media/music/boost-a.mp3' },
  { title: 'BOOST ▸ II', url: '/media/music/boost-b.mp3' },
  { title: 'BOOST ▸ III', url: '/media/music/boost-c.mp3' },
  { title: 'BOOST ▸ IV', url: '/media/music/boost-d.mp3' },
  { title: 'LAUNCH CONTROL', url: '/media/music/launch-control-a.mp3' },
  { title: 'LAUNCH CONTROL ▸ II', url: '/media/music/launch-control-b.mp3' },
  { title: 'NIGHT SHIFT', url: '/media/music/night-shift-a.mp3' },
  { title: 'NIGHT SHIFT ▸ II', url: '/media/music/night-shift-b.mp3' },
  { title: 'NIGHT SHIFT ▸ III', url: '/media/music/night-shift-c.mp3' },
  { title: 'REDLINE', url: '/media/music/redline-a.mp3' },
  { title: 'REDLINE ▸ II', url: '/media/music/redline-b.mp3' },
  { title: 'WIDEBODY', url: '/media/music/widebody-a.mp3' },
  { title: 'WIDEBODY ▸ II', url: '/media/music/widebody-b.mp3' },
];
