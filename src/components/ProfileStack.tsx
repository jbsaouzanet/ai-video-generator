import React from 'react';
import {useTL} from '../tl';
import {ProfileCard} from './ProfileCard';

/** The two profile cards. Global element: they travel from the left (scene 2) to the right column (scene 3). */
export const ProfileStack: React.FC<{frame: number}> = ({frame}) => {
	const {profile} = useTL();
	return (
	<>
		{([0, 1] as const).map((i) => (
			<ProfileCard
				key={i}
				index={i}
				box={profile.box(i, frame)}
				enter={profile.enter(i, frame)}
				exit={profile.exit(frame)}
				active={profile.active(i, frame)}
				learned={profile.learned(i, frame)}
				touch={profile.touch(i, frame)}
			/>
		))}
	</>
	);
};
