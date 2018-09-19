'use strict';

var locale = 'en_us';

var locales = Object.freeze({
	en: {
		back: 'Back',
		enemies: 'Enemies',
		letsago: 'Let\'s a go!',
		mylevels: 'MY LEVELS',
		namelevel: 'Name your level:',
		namemutable: '(You can change this later.)',
		platforms: 'Platforms',
		powerups: 'Power-ups'
	},

	en_us: {},
	en_gb: {},

	es: {
		back: 'Atrás',
		enemies: 'Los enemigos',
		letsago: '¡Adelante!',
		mylevels: 'MIS PANTALLAS',
		namelevel: 'Llamas la pantalla:',
		namemutable: '(Puedes cambiar esto luego.)',
		platforms: 'Las plataformas',
		powerups: 'Los ítems'
	}
});

function localize (unloc, loc) {
	loc = loc || locale;

	return locales[loc][unloc] || locales[loc.substring(0, loc.indexOf('_'))][unloc] || 'unloc:' + unloc;
}
