import { Share } from 'react-native';

import { APP_NAME, links } from '@/constants/app';


async function share(message: string) {
  try {
    await Share.share({ message });
  } catch {
   
  }
}

export function shareItem(item: { id: string; title: string }) {
  return share(`${item.title} on ${APP_NAME} — ${links.item(item.id)}`);
}

export function shareTrader(trader: { id: string; name: string }) {
  return share(`${trader.name} on ${APP_NAME} — ${links.trader(trader.id)}`);
}
