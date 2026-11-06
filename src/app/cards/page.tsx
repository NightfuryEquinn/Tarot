import { Header, Footer } from '@/components/Shell';
import type { Metadata } from 'next';
import { CardLibrary } from '@/components/CardLibrary';
export const metadata:Metadata={title:'The deck',description:'Explore all 78 Rider–Waite–Smith tarot cards, their upright and reversed meanings, and the four suits.'};
export default function CardsPage(){return <><Header/><CardLibrary/><Footer/></>;}
