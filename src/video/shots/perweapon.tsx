// Registers the 10 existing per-weapon (PS5) chapter components (src/perweapon/chapters1.tsx,
// chapters2.tsx) as Shots, unchanged, under the perweapon/* namespace — same "wrap an existing opaque
// component" path as src/video/shots/xboxpw.ts, at one level higher granularity: each shot bundles a
// chapter's own <TLProvider>+<CronusHero> (src/perweapon/Film.tsx's `Layers`), not just the bare chapter
// component, because each chapter owns its own camera timeline (TL_HOOK, TL_WHY, ...) — there is no
// project-wide continuous pose here (unlike xboxpw), so that has to travel with the shot, not the model.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {CronusHero} from '../../components/CronusHero';
import {TLProvider, type TL} from '../../tl';
import {ChapterFirst, ChapterHook, ChapterTune, ChapterTurn, ChapterWhy} from '../../perweapon/chapters1';
import {ChapterAmbig, ChapterCheat, ChapterEdit, ChapterEnd, ChapterTeach} from '../../perweapon/chapters2';
import {TL_AMBIG, TL_CHEAT, TL_EDIT, TL_END, TL_FIRST, TL_HOOK, TL_TEACH, TL_TUNE, TL_TURN, TL_WHY} from '../../perweapon/tl';
import {registerShot} from './registry';

const emptySchema = z.object({});

const wrap = (id: string, Chapter: React.FC, tl: TL, description: string) => {
	const Wrapped: React.FC = () => {
		const f = useCurrentFrame();
		return (
			<TLProvider tl={tl}>
				<CronusHero frame={f} />
				<Chapter />
			</TLProvider>
		);
	};
	registerShot({id, component: Wrapped, schema: emptySchema, metadata: {description, tags: ['perweapon-ps5', 'chapter']}});
};

wrap('perweapon/hook', ChapterHook, TL_HOOK, 'Per Weapon PS5 hook: title + "every weapon, its own anti-recoil" tag.');
wrap('perweapon/why', ChapterWhy, TL_WHY, 'Profiles-vs-slots compare argument.');
wrap('perweapon/turn', ChapterTurn, TL_TURN, '"Turn it on" step list (PS5).');
wrap('perweapon/first', ChapterFirst, TL_FIRST, 'Fire once: the weapon claims its own slot automatically.');
wrap('perweapon/tune', ChapterTune, TL_TUNE, 'Live-tune two weapon panels side by side.');
wrap('perweapon/ambig', ChapterAmbig, TL_AMBIG, 'Same-signature weapons: switch candidate or force from the slot list.');
wrap('perweapon/teach', ChapterTeach, TL_TEACH, 'Teach Weapon wizard, 6 steps.');
wrap('perweapon/edit', ChapterEdit, TL_EDIT, 'Edit a saved slot + delete confirmation.');
wrap('perweapon/cheat', ChapterCheat, TL_CHEAT, 'Cheat-sheet recap of every control.');
wrap('perweapon/end', ChapterEnd, TL_END, 'Brand lockup + doc URL.');
