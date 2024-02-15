import styles from './BotProfileCard.module.css';
import { BOT_IMAGES } from '@/app/lib/botUtils';
import { BotNames } from '@/app/lib/definitions';
import Image from 'next/image';


export function BotProfileCard() {
  const name = "Randomizer";
  const description = "\"I bet you can't predict what I'll do next!\" The Randomizer uses an algorithm that creates completely random moves. They have the element of surprise, but can you take them down?";

  return (
    <div className={styles.card}>
      <div className={styles.profileImageContainer}>
        <Image
          src={BOT_IMAGES[name.toLowerCase() as BotNames]!}
          className={styles.botImage}
          alt={`${name}'s profile picture`}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className={styles.header}>
        {name}
      </div>
      <div className={styles.description}>
        <p className={styles.descriptionText}>{description}</p>
      </div>
    </div>
  );
}