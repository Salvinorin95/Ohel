// Journeys of the Bible, drawn on the map stop by stop. Each stop is a place on the map (or, where the
// text names no place we have, a labelled point), with the verse that puts the journey there.
// `via` points only shape the line between stops (roads followed the Fertile Crescent, not the desert);
// they are approximate and never shown as places.

export interface JourneyStop {
  place?: string; // an id from shared/places.ts
  at?: { lat: number; lng: number; he: string; en: string }; // a point that isn't one of our places
  ref: string; // the verse, Hebrew numbering
  he: string;
  en: string;
  via?: [number, number][]; // [lng, lat] points leading INTO this stop
}

export interface Journey {
  id: string;
  he: string;
  en: string;
  color: string;
  intro: { he: string; en: string };
  stops: JourneyStop[];
}

// The road between Mesopotamia and Canaan, along the Euphrates and down through Syria.
const EUPHRATES_UP: [number, number][] = [[45.2, 31.7], [44.4, 32.6], [43.3, 33.3], [42.2, 34.3], [40.9, 34.6], [39.9, 35.4], [39.1, 35.9]];
const SYRIA_SOUTH: [number, number][] = [[37.2, 36.2], [36.75, 35.15], [36.6, 34.4], [36.3, 33.5], [35.75, 32.75]];

export const JOURNEYS: Journey[] = [
  {
    id: "abraham",
    he: "המסע של אברהם",
    en: "Abraham's journey",
    color: "#fbbf24",
    intro: {
      he: "מאור שבדרום מסופוטמיה, לאורך הפרת לחרן, ומשם לארץ כנען. אוהל שזז ממקום למקום, ובכל מקום מזבח.",
      en: "From Ur in southern Mesopotamia, up the Euphrates to Haran, and on to Canaan: a tent on the move, with an altar wherever it stopped.",
    },
    stops: [
      { place: "ur", ref: "Genesis 11:31", he: "תרח לוקח את אברם, את שרי ואת לוט ויוצא מאור כשדים בדרך לכנען.", en: "Terah takes Abram, Sarai and Lot and sets out from Ur of the Chaldeans for Canaan." },
      { place: "haran", ref: "Genesis 12:4", via: EUPHRATES_UP, he: "הם נעצרים בחרן. כאן אברם שומע ״לך לך״, ויוצא בגיל שבעים וחמש.", en: "They settle in Haran. Here Abram hears \"Go forth\", and leaves at seventy-five." },
      { place: "shechem", ref: "Genesis 12:6", via: SYRIA_SOUTH, he: "התחנה הראשונה בכנען: אלון מורה בשכם. כאן הוא שומע ״לזרעך אתן את הארץ הזאת״ ובונה מזבח.", en: "His first stop in Canaan is the oak of Moreh at Shechem. He hears \"To your offspring I will give this land\" and builds an altar." },
      { place: "bethel", ref: "Genesis 12:8", he: "הוא נוטה את אהלו בין בית אל במערב והעי במזרח, ובונה עוד מזבח.", en: "He pitches his tent with Bethel to the west and Ai to the east, and builds another altar." },
      { at: { lat: 30.35, lng: 31.55, he: "מצרים", en: "Egypt" }, ref: "Genesis 12:10", via: [[34.8, 31.25], [34.2, 31.0], [33.0, 30.95]], he: "רעב בארץ, ואברם יורד למצרים.", en: "Famine strikes the land, and Abram goes down to Egypt." },
      { place: "bethel", ref: "Genesis 13:3", via: [[33.0, 30.95], [34.2, 31.0], [34.8, 31.3]], he: "הוא חוזר צפונה, עד המקום שבו היה אהלו בהתחלה, בין בית אל לעי.", en: "He comes back north, to the place where his tent had stood at first, between Bethel and Ai." },
      { place: "mamre", ref: "Genesis 18:1", he: "באלוני ממרא הוא יושב בפתח האוהל בחום היום, רואה שלושה זרים ורץ לקראתם. מכאן השם ״אוהל״.", en: "At the oaks of Mamre he sits at his tent door in the heat of the day, sees three strangers and runs to meet them. This is the tent Ohel is named after." },
      { place: "gerar", ref: "Genesis 20:1", he: "הוא נוסע לנגב וגר בגרר.", en: "He moves to the Negev and lives for a while in Gerar." },
      { place: "beersheba", ref: "Genesis 21:33", he: "בבאר שבע הוא נוטע אשל וקורא בשם ה׳.", en: "At Beersheba he plants a tamarisk tree and calls on the name of the LORD." },
      { place: "moriah", ref: "Genesis 22:2", he: "״לך לך אל ארץ המוריה״: העקדה.", en: "\"Go to the land of Moriah\": the binding of Isaac." },
      { place: "hebron", ref: "Genesis 25:9", he: "יצחק וישמעאל קוברים את אברהם במערת המכפלה, ליד שרה.", en: "Isaac and Ishmael bury Abraham in the cave of Machpelah, beside Sarah." },
    ],
  },
  {
    id: "jacob",
    he: "המסע של יעקב",
    en: "Jacob's journey",
    color: "#a78bfa",
    intro: {
      he: "יעקב בורח מעשו לחרן, חוזר אחרי עשרים שנה עם משפחה גדולה, נאבק בנחל יבוק ויורד בסוף למצרים. אלה פרשות ויצא וישלח.",
      en: "Jacob runs from Esau to Haran, comes back twenty years later with a large family, wrestles at the Jabbok, and in the end goes down to Egypt. These are the portions Vayetzei and Vayishlach.",
    },
    stops: [
      { place: "beersheba", ref: "Genesis 28:10", he: "״ויצא יעקב מבאר שבע וילך חרנה״.", en: "\"Jacob left Beersheba and set out for Haran.\"" },
      { place: "bethel", ref: "Genesis 28:19", he: "בדרך הוא ישן על אבן וחולם על סולם שמגיע השמימה. הוא קורא למקום בית אל.", en: "On the way he sleeps on a stone and dreams of a ladder reaching to heaven. He calls the place Bethel." },
      { place: "haran", ref: "Genesis 29:4", via: [...SYRIA_SOUTH].reverse(), he: "בחרן, ליד הבאר, הוא פוגש את רחל. הוא נשאר עשרים שנה.", en: "At the well near Haran he meets Rachel. He stays twenty years." },
      { at: { lat: 32.33, lng: 35.78, he: "הר הגלעד", en: "The hill country of Gilead" }, ref: "Genesis 31:21", via: SYRIA_SOUTH.slice(0, 4), he: "הוא בורח מלבן, חוצה את הנהר ופונה להר הגלעד. שם לבן משיג אותו, והם כורתים ברית ליד גל אבנים.", en: "He slips away from Laban, crosses the river and heads for the hill country of Gilead. Laban catches up, and they make a pact by a heap of stones." },
      { place: "mahanaim", ref: "Genesis 32:3", he: "מלאכי אלוהים פוגשים אותו. ״מחנה אלוהים זה״, והוא קורא למקום מחנים.", en: "Angels of God meet him. \"This is God's camp\", he says, and names the place Mahanaim." },
      { place: "jabbok", ref: "Genesis 32:31", he: "בלילה, במעבר יבוק, הוא נאבק עד עלות השחר ומקבל את השם ישראל. ״ראיתי אלוהים פנים אל פנים״.", en: "At night, at the ford of the Jabbok, he wrestles until dawn and is given the name Israel. \"I have seen God face to face.\"" },
      { place: "shechem", ref: "Genesis 33:18", he: "הוא מגיע בשלום לעיר שכם וקונה חלקת שדה.", en: "He arrives safely at the city of Shechem and buys a piece of land." },
      { place: "bethel", ref: "Genesis 35:7", he: "הוא חוזר לבית אל ובונה מזבח במקום שבו חלם.", en: "He returns to Bethel and builds an altar where he had dreamed." },
      { place: "bethlehem", ref: "Genesis 35:19", he: "רחל מתה בדרך אפרתה, היא בית לחם.", en: "Rachel dies on the road to Ephrath, that is, Bethlehem." },
      { place: "mamre", ref: "Genesis 35:27", he: "יעקב מגיע אל יצחק אביו בממרא.", en: "Jacob comes home to his father Isaac at Mamre." },
      { place: "beersheba", ref: "Genesis 46:1", he: "שנים אחר כך, בדרך למצרים, הוא עוצר בבאר שבע ושומע ״אל תירא מרדה מצרימה״.", en: "Years later, on his way to Egypt, he stops at Beersheba and hears \"Do not be afraid to go down to Egypt.\"" },
      { place: "goshen", ref: "Genesis 47:27", via: [[34.2, 31.0], [33.0, 30.95]], he: "ישראל יושבים בארץ גושן, ופרים ורבים.", en: "Israel settles in the land of Goshen, and grows and multiplies." },
    ],
  },
  {
    id: "exodus",
    he: "יציאת מצרים",
    en: "The Exodus",
    color: "#22d3ee",
    intro: {
      he: "מרעמסס, דרך ים סוף וסיני, ארבעים שנה במדבר, עד מעבר הירדן ליד יריחו. המסלול המדויק שנוי במחלוקת. כאן מוצג המסלול המסורתי, דרך דרום סיני.",
      en: "From Raamses through the Sea of Reeds and Sinai, forty years in the wilderness, to the Jordan crossing at Jericho. The exact route is debated; this is the traditional one, through southern Sinai.",
    },
    stops: [
      { place: "raamses", ref: "Exodus 12:37", he: "בני ישראל נוסעים מרעמסס סוכותה, כשש מאות אלף רגלי.", en: "The Israelites set out from Raamses toward Succoth, about six hundred thousand on foot." },
      { place: "redsea", ref: "Exodus 14:22", he: "הים נבקע, והם עוברים ביבשה ״והמים להם חומה מימינם ומשמאלם״.", en: "The sea parts and they walk through on dry ground, \"the waters a wall to them on their right and on their left.\"" },
      { place: "sinai", ref: "Exodus 19:2", via: [[32.6, 29.9], [32.85, 29.3], [33.2, 28.9], [33.6, 28.65]], he: "בחודש השלישי הם מגיעים למדבר סיני וחונים מול ההר. כאן ניתנת התורה.", en: "In the third month they reach the wilderness of Sinai and camp before the mountain. Here the Torah is given." },
      { place: "kadesh", ref: "Numbers 13:26", via: [[34.3, 29.1], [34.6, 29.8], [34.55, 30.3]], he: "מקדש ברנע יוצאים המרגלים לתור את הארץ, וחוזרים עם אשכול ענבים ועם פחד.", en: "From Kadesh-barnea the spies go out to scout the land, and come back with a cluster of grapes and with fear." },
      { place: "mounthor", ref: "Numbers 20:28", he: "על הור ההר מת אהרן, ובית ישראל בוכים אותו שלושים יום.", en: "Aaron dies on Mount Hor, and all Israel mourns him for thirty days." },
      { place: "heshbon", ref: "Numbers 21:25", via: [[35.15, 29.75], [35.75, 30.1], [36.0, 30.8], [35.95, 31.35]], he: "הם מקיפים את ארץ אדום וכובשים את חשבון, עיר סיחון מלך האמורי.", en: "They go around the land of Edom and take Heshbon, the city of Sihon king of the Amorites." },
      { place: "shittim", ref: "Numbers 25:1", he: "בשיטים, בערבות מואב, הם חונים מול יריחו.", en: "At Shittim, on the plains of Moab, they camp across from Jericho." },
      { place: "nebo", ref: "Deuteronomy 34:1", he: "משה עולה להר נבו, רואה את כל הארץ, ומת שם.", en: "Moses climbs Mount Nebo, sees the whole land, and dies there." },
      { place: "jordan", ref: "Joshua 3:17", he: "הכוהנים עומדים בירדן עם הארון, והעם עובר ביבשה.", en: "The priests stand in the Jordan with the ark, and the people cross on dry ground." },
      { place: "gilgal", ref: "Joshua 4:20", he: "בגלגל מקים יהושע את שתים עשרה האבנים מן הירדן.", en: "At Gilgal Joshua sets up the twelve stones taken from the Jordan." },
      { place: "jericho", ref: "Joshua 6:20", he: "השופרות תוקעים, העם מריע, וחומת יריחו נופלת.", en: "The horns sound, the people shout, and the wall of Jericho falls." },
    ],
  },
  {
    id: "david",
    he: "דוד בורח משאול",
    en: "David on the run from Saul",
    color: "#f472b6",
    intro: {
      he: "מהבית בגבעה, דרך מערות ומדבריות וארץ הפלשתים, עד שהוא נמשח למלך בחברון וכובש את ירושלים.",
      en: "From home in Gibeah, through caves, deserts and Philistine country, until he is anointed king in Hebron and takes Jerusalem.",
    },
    stops: [
      { place: "gibeah", ref: "I Samuel 19:12", he: "מיכל מורידה את דוד בעד החלון, והוא בורח ממלכודת של שאול.", en: "Michal lets David down through a window, and he escapes Saul's trap." },
      { place: "ramah", ref: "I Samuel 19:18", he: "הוא בורח אל שמואל ברמה ומספר לו הכול.", en: "He flees to Samuel at Ramah and tells him everything." },
      { place: "gath", ref: "I Samuel 21:11", he: "הוא בורח אל אכיש מלך גת, ומעמיד פני משוגע כדי להינצל.", en: "He runs to Achish king of Gath, and pretends to be mad to save himself." },
      { place: "adullam", ref: "I Samuel 22:1", he: "במערת עדולם מתאספים סביבו כ־400 איש: ״כל איש מצוק, וכל איש אשר לו נשא, וכל איש מר נפש״.", en: "At the cave of Adullam about four hundred men gather to him: everyone in distress, in debt or bitter of soul." },
      { place: "eingedi", ref: "I Samuel 24:5", he: "במערה במדבר עין גדי הוא כורת את כנף מעיל שאול, ולא פוגע בו.", en: "In a cave in the wilderness of Ein Gedi he cuts off the corner of Saul's robe, and leaves him unharmed." },
      { place: "carmeljudah", ref: "I Samuel 25:2", he: "בכרמל הוא פוגש את נבל, ואת אביגיל שעוצרת אותו מנקמה.", en: "At Carmel he meets Nabal, and Abigail, who stops him from taking revenge." },
      { place: "ziklag", ref: "I Samuel 27:6", via: [[34.95, 31.45]], he: "אכיש נותן לו את צקלג, ושם הוא יושב שנה וארבעה חודשים.", en: "Achish gives him Ziklag, and he lives there a year and four months." },
      { place: "gilboa", ref: "I Samuel 31:6", he: "בינתיים, בהר הגלבוע, נופלים שאול ובניו בקרב עם הפלשתים.", en: "Meanwhile, on Mount Gilboa, Saul and his sons fall in battle with the Philistines." },
      { place: "hebron", ref: "II Samuel 2:4", via: [[35.0, 31.9], [35.05, 31.6]], he: "אנשי יהודה מושחים את דוד למלך בחברון.", en: "The men of Judah anoint David king in Hebron." },
      { place: "cityofdavid", ref: "II Samuel 5:7", he: "דוד לוכד את מצודת ציון, היא עיר דוד.", en: "David captures the stronghold of Zion, which becomes the City of David." },
    ],
  },
  {
    id: "elijah",
    he: "המסע של אליהו",
    en: "Elijah's journey",
    color: "#fb923c",
    intro: {
      he: "מצרפת שעל חוף פיניקיה, להר הכרמל, דרך המדבר אל חורב, ובסוף אל הירדן, שבו הוא עולה בסערה השמימה.",
      en: "From Zarephath on the Phoenician coast to Mount Carmel, through the desert to Horeb, and at last to the Jordan, where he goes up to heaven in a whirlwind.",
    },
    stops: [
      { place: "zarephath", ref: "I Kings 17:9", he: "בימי הבצורת אליהו נשלח לאלמנה בצרפת: ״כד הקמח לא כלתה וצפחת השמן לא חסר״.", en: "In the drought Elijah is sent to a widow in Zarephath: her jar of flour does not run out and her jug of oil does not fail." },
      { place: "carmel", ref: "I Kings 18:38", via: [[35.15, 33.1], [35.05, 32.85]], he: "על הכרמל יורדת אש מן השמיים, והעם קורא ״ה׳ הוא האלוהים״.", en: "On Carmel fire falls from heaven, and the people cry out, \"The LORD, He is God!\"" },
      { place: "kishon", ref: "I Kings 18:40", he: "אליהו מוריד את נביאי הבעל אל נחל קישון.", en: "Elijah brings the prophets of Baal down to the Kishon brook." },
      { place: "jezreel", ref: "I Kings 18:46", he: "הגשם מגיע, ואליהו רץ לפני מרכבת אחאב עד יזרעאל.", en: "The rain comes, and Elijah runs ahead of Ahab's chariot all the way to Jezreel." },
      { place: "beersheba", ref: "I Kings 19:3", via: [[35.25, 32.2], [35.2, 31.7]], he: "איזבל מאיימת עליו, והוא בורח לבאר שבע ומשם למדבר.", en: "Jezebel threatens him, and he flees to Beersheba and on into the desert." },
      { place: "sinai", ref: "I Kings 19:8", via: [[34.6, 30.6], [34.5, 29.9], [34.2, 29.2]], he: "ארבעים יום וארבעים לילה הוא הולך עד הר האלוהים חורב, ושם שומע ״קול דממה דקה״.", en: "For forty days and forty nights he walks to Horeb, the mountain of God, and there hears \"a still, small voice\"." },
      { place: "gilgal", ref: "II Kings 2:1", via: [[34.5, 29.9], [34.9, 30.8], [35.3, 31.4]], he: "שנים אחר כך, עם אלישע, הוא יוצא מן הגלגל. ייתכן שזה גלגל אחר, בהרים.", en: "Years later, with Elisha, he sets out from Gilgal (possibly a different Gilgal, in the hills)." },
      { place: "bethel", ref: "II Kings 2:2", he: "״חי ה׳ וחי נפשך אם אעזבך״, ושניהם יורדים לבית אל.", en: "\"As the LORD lives, I will not leave you\", and the two go down to Bethel." },
      { place: "jericho", ref: "II Kings 2:4", he: "ומשם ליריחו.", en: "And from there to Jericho." },
      { place: "jordan", ref: "II Kings 2:11", he: "אליהו מכה את המים באדרתו, הם עוברים ביבשה, ורכב אש לוקח אותו בסערה השמימה.", en: "Elijah strikes the water with his cloak, they cross on dry ground, and a chariot of fire takes him up to heaven in a whirlwind." },
    ],
  },
  {
    id: "exile",
    he: "הגלות לבבל והשיבה",
    en: "Exile to Babylon, and the return",
    color: "#60a5fa",
    intro: {
      he: "בשנת 586 לפנה״ס בבל כובשת את ירושלים. המלך צדקיהו נלכד, והעם הולך בדרך הארוכה לבבל. כחמישים שנה אחר כך, בימי כורש, חלק חוזרים.",
      en: "In 586 BCE Babylon takes Jerusalem. King Zedekiah is caught, and the people walk the long road to Babylon. About fifty years later, under Cyrus, some come home.",
    },
    stops: [
      { place: "cityofdavid", ref: "II Kings 25:4", he: "אחרי מצור ורעב, החומה נפרצת, וצדקיהו בורח בלילה דרך הערבה.", en: "After siege and famine the wall is breached, and Zedekiah flees by night toward the Arabah." },
      { place: "jericho", ref: "II Kings 25:5", he: "חיל כשדים משיג אותו בערבות יריחו.", en: "The Babylonian army overtakes him on the plains of Jericho." },
      { place: "riblah", ref: "II Kings 25:6", via: [[35.75, 32.75], [36.3, 33.5]], he: "ברבלה, המטה של נבוכדנצר, צדקיהו עומד לדין. בניו נהרגים לנגד עיניו, והוא מעוור.", en: "At Riblah, Nebuchadnezzar's headquarters, Zedekiah is judged. His sons are killed before him, and he is blinded." },
      { place: "babylon", ref: "Psalms 137:1", via: [[36.75, 35.15], [37.2, 36.2], [38.1, 36.0], [39.1, 35.9], [39.9, 35.4], [40.9, 34.6], [42.2, 34.3], [43.3, 33.3]], he: "״על נהרות בבל, שם ישבנו גם בכינו בזכרנו את ציון״.", en: "\"By the rivers of Babylon, there we sat down, and wept when we remembered Zion.\"" },
      { place: "moriah", ref: "Ezra 3:11", via: [[43.3, 33.3], [42.2, 34.3], [40.9, 34.6], [39.1, 35.9], [37.2, 36.2], [36.75, 35.15], [36.3, 33.5], [35.75, 32.75]], he: "כורש מתיר לחזור. השבים מניחים את יסוד הבית, ״והעם הריעו תרועה גדולה״, והזקנים שזכרו את הבית הראשון בוכים.", en: "Cyrus lets them return. They lay the foundation of the House; the people shout for joy, and the old who remembered the first Temple weep." },
    ],
  },
];

export const findJourney = (id: string | null | undefined) => JOURNEYS.find((j) => j.id === id) ?? null;
