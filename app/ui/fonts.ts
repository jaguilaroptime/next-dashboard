import { Inter, Lusitana, Rock_3D } from 'next/font/google';

export const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', 
});

export const rock_3d = Rock_3D({
  weight: ['400'],
  subsets: ['latin'],
})

export const lusitana = Lusitana({
    weight: ['400', '700'],
    subsets: ['latin'],
  });