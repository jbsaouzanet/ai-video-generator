// Registers the 6 existing src/blocks/Blocks.tsx components as Shots, unchanged — no behavior change, just
// discoverability (docs/ARCHITECTURE.md "Migration strategy" step 4). See README.md in this folder for what
// each one is for. Schemas validate what Zod meaningfully can; React-node-valued props (labels that may be
// JSX, not just strings) use z.custom<React.ReactNode>() — an honest opaque-type placeholder, not a fake
// runtime check, since Zod has no real way to validate "is this renderable."
import React from 'react';
import {z} from 'zod';
import {ChipFlowBlock, CompareBlock, EndLockupBlock, StepListBlock, TitleBlock, TuneGaugeBlock} from '../../blocks/Blocks';
import {registerShot} from './registry';

const node = () => z.custom<React.ReactNode>(() => true);

const TitleLineSchema = z.object({
	text: z.string(),
	size: z.number(),
	weight: z.number().optional(),
	gradient: z.boolean().optional(),
	tracking: z.number().optional(),
	glow: z.string().optional(),
	color: z.string().optional(),
});

registerShot({
	id: 'title',
	component: TitleBlock,
	schema: z.object({
		x: z.number(),
		y: z.number(),
		width: z.number(),
		align: z.enum(['left', 'center']).optional(),
		kicker: z.string().optional(),
		lines: z.array(TitleLineSchema),
		delayF: z.number(),
	}),
	metadata: {
		description: 'A hook/section title: optional small kicker line + 1-2 large headline lines, staggered in.',
		recommendedDurationSeconds: [1.5, 4],
		tags: ['title', 'hook', 'headline'],
	},
});

const StepSchema = z.object({label: node(), combo: z.array(z.string()).optional(), doneAtF: z.number().optional()});

registerShot({
	id: 'step-list',
	component: StepListBlock,
	schema: z.object({
		x: z.number(),
		y: z.number(),
		w: z.number(),
		h: z.number(),
		rowGap: z.number(),
		steps: z.array(StepSchema),
		enterAtF: z.function({input: [z.number()], output: z.number()}),
		frame: z.number(),
		keySize: z.number().optional(),
	}),
	metadata: {
		description: 'Numbered rows for "how to turn it on" style steps; each row can show a key-combo and check off at a given frame.',
		recommendedDurationSeconds: [3, 8],
		tags: ['steps', 'how-to', 'tutorial'],
	},
});

const FlowChipSchema = z.object({label: z.string(), state: z.enum(['dim', 'bad', 'good']), enterAtF: z.number(), strikeAtF: z.number().optional()});

registerShot({
	id: 'chip-flow',
	component: ChipFlowBlock,
	schema: z.object({
		x: z.number(),
		y: z.number(),
		chips: z.array(FlowChipSchema),
		frame: z.number(),
		font: z.number().optional(),
		vertical: z.boolean().optional(),
		width: z.number().optional(),
	}),
	metadata: {
		description: 'A chain of chips joined by arrows, each independently dim/bad(struck-through)/good — e.g. "GAME UPDATE -> WAIT -> YOU UPDATE IT".',
		recommendedDurationSeconds: [2, 5],
		tags: ['chips', 'flow', 'compare'],
	},
});

registerShot({
	id: 'tune-gauge',
	component: TuneGaugeBlock,
	schema: z.object({
		x: z.number(),
		y: z.number(),
		enterAtF: z.number(),
		frame: z.number(),
		level: z.number(),
		upCombo: z.array(z.string()),
		downCombo: z.array(z.string()),
		upAtF: z.number(),
		downAtF: z.number(),
		valueLabel: node(),
		noteAtF: z.number().optional(),
		note: z.string().optional(),
	}),
	metadata: {
		description: 'A live-tune value gauge + key-combo readout, e.g. "hold L2, press Up/Down while firing".',
		recommendedDurationSeconds: [3, 7],
		tags: ['gauge', 'tuning', 'live-demo'],
	},
});

const CompareRowSchema = z.object({label: z.string(), tag: z.string().optional()});

registerShot({
	id: 'compare',
	component: CompareBlock,
	schema: z.object({
		x: z.number(),
		y: z.number(),
		w: z.number(),
		frame: z.number(),
		oldLabel: z.string(),
		oldEnterAtF: z.number(),
		oldDimAtF: z.number(),
		newLabel: z.string(),
		newEnterAtF: z.number(),
		rows: z.array(CompareRowSchema),
		rowsStartAtF: z.number(),
		rowH: z.number().optional(),
		rowGap: z.number().optional(),
	}),
	metadata: {
		description: 'A dim "old way" label that fades as a lit column of "new way" rows takes over — the category-vs-per-item argument every topic so far has opened with.',
		recommendedDurationSeconds: [3, 7],
		tags: ['compare', 'category-vs-item', 'argument'],
	},
});

registerShot({
	id: 'end-lockup',
	component: EndLockupBlock,
	schema: z.object({
		x: z.number(),
		y: z.number(),
		width: z.number(),
		align: z.enum(['left', 'center']).optional(),
		title: z.string(),
		titleSize: z.number(),
		tagline: z.string().optional(),
		taglineSize: z.number().optional(),
		delayF: z.number(),
		scrim: z.boolean().optional(),
	}),
	metadata: {
		description: 'Brand title + optional tagline lockup, optionally over a text scrim — the closing beat of every film.',
		recommendedDurationSeconds: [2, 4],
		tags: ['end', 'lockup', 'brand'],
	},
});
