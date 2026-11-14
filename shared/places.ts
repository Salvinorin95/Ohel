// Places of the Hebrew Bible with approximate coordinates.
// certainty: "known" = site identified with good confidence,
// "traditional" = where tradition places it, "debated" = one candidate among several.

export type Certainty = "known" | "traditional" | "debated";

export interface Place {
  id: string;
  en: string;
  he: string;
  lat: number;
  lng: number;
  zoom: number;
  certainty: Certainty;
  refs: string[];
  story: { en: string; he: string };
}

export const PLACES: Place[] = [
  // ── The Jezreel Valley and Mount Gilboa ─────────────────────────
  {
    id: "gilboa", en: "Mount Gilboa", he: "הר הגלבוע", lat: 32.465, lng: 35.41, zoom: 12.2, certainty: "known",
    refs: ["I Samuel 28", "I Samuel 31", "II Samuel 1", "I Chronicles 10"],
    story: {
      en: "Saul's last battle. The Philistines pressed up the ridge, Jonathan fell, and Saul fell on his own sword. David's lament: “Mountains of Gilboa, let there be no dew…”",
      he: "הקרב האחרון של שאול. הפלשתים עלו על הרכס, יהונתן נפל ושאול נפל על חרבו. קינת דוד: ״הָרֵי בַגִּלְבֹּעַ אַל טַל…״",
    },
  },
  {
    id: "harod", en: "Spring of Harod", he: "מעיין חרוד", lat: 32.5486, lng: 35.3569, zoom: 14, certainty: "known",
    refs: ["Judges 7", "I Samuel 29"],
    story: {
      en: "Gideon tested his men by how they drank here. Before Gilboa, Israel camped “by the spring in Jezreel.”",
      he: "כאן בחר גדעון את לוחמיו לפי הדרך שבה שתו מים. לפני הקרב בגלבוע חנו ישראל ״בעין אשר ביזרעאל״.",
    },
  },
  {
    id: "shunem", en: "Shunem", he: "שונם", lat: 32.6058, lng: 35.3333, zoom: 13.5, certainty: "known",
    refs: ["I Samuel 28", "II Kings 4"],
    story: {
      en: "The Philistine camp across the valley from Saul. Later, home of the Shunammite woman who hosted Elisha.",
      he: "מחנה הפלשתים מול שאול, מעבר לעמק. לימים ביתה של השונמית שאירחה את אלישע.",
    },
  },
  {
    id: "endor", en: "Endor", he: "עין דור", lat: 32.6564, lng: 35.415, zoom: 13.5, certainty: "known",
    refs: ["I Samuel 28"],
    story: {
      en: "The night before the battle, Saul crept past the Philistine camp in disguise to the woman who called up Samuel.",
      he: "בלילה שלפני הקרב התחפש שאול ועבר ליד מחנה הפלשתים אל בעלת האוב, שהעלתה את שמואל.",
    },
  },
  {
    id: "jezreel", en: "Jezreel", he: "יזרעאל", lat: 32.5574, lng: 35.3283, zoom: 14, certainty: "known",
    refs: ["I Kings 18", "I Kings 21", "II Kings 9"],
    story: {
      en: "Ahab's winter palace, Naboth's vineyard, and the fall of Jezebel.",
      he: "ארמון אחאב, כרם נבות, ונפילתה של איזבל.",
    },
  },
  {
    id: "bethshean", en: "Beth-shean", he: "בית שאן", lat: 32.5044, lng: 35.5022, zoom: 14, certainty: "known",
    refs: ["I Samuel 31", "Joshua 17"],
    story: {
      en: "The Philistines hung the bodies of Saul and his sons on the city wall here.",
      he: "הפלשתים תקעו את גופות שאול ובניו על חומת העיר.",
    },
  },
  {
    id: "jabesh", en: "Jabesh-gilead", he: "יבש גלעד", lat: 32.3974, lng: 35.5834, zoom: 12.5, certainty: "debated",
    refs: ["I Samuel 11", "I Samuel 31"],
    story: {
      en: "Saul once rescued this town. Its men repaid him: they walked all night to take his body from the wall and bury it.",
      he: "שאול הציל פעם את העיר. אנשיה גמלו לו: הלכו כל הלילה, הורידו את גופתו מהחומה וקברו אותה.",
    },
  },
  {
    id: "megiddo", en: "Megiddo", he: "מגידו", lat: 32.5853, lng: 35.1847, zoom: 14, certainty: "known",
    refs: ["Judges 5", "I Kings 9", "II Kings 23"],
    story: {
      en: "Guardian of the pass. Deborah's song, Solomon's fortress, King Josiah's death.",
      he: "שומר המעבר. שירת דבורה, מבצר שלמה, ומות המלך יאשיהו.",
    },
  },
  {
    id: "tabor", en: "Mount Tabor", he: "הר תבור", lat: 32.6869, lng: 35.3906, zoom: 13, certainty: "known",
    refs: ["Judges 4", "Psalms 89"],
    story: {
      en: "Barak gathered ten thousand on the rounded summit and charged down at Sisera's chariots.",
      he: "ברק אסף עשרת אלפים על הפסגה העגולה ופרץ למטה מול רכב סיסרא.",
    },
  },
  {
    id: "carmel", en: "Mount Carmel (Muhraka)", he: "הר הכרמל (המוחרקה)", lat: 32.6697, lng: 35.0872, zoom: 13.5, certainty: "traditional",
    refs: ["I Kings 18"],
    story: {
      en: "Elijah against the prophets of Baal. Fire falls, and then a small cloud rises from the sea.",
      he: "אליהו מול נביאי הבעל. אש יורדת מהשמיים, ואחר כך עב קטנה כף איש עולה מן הים.",
    },
  },
  // ── Judah, Benjamin and Jerusalem ────────────────────────────────
  {
    id: "elah", en: "Valley of Elah", he: "עמק האלה", lat: 31.695, lng: 34.955, zoom: 13, certainty: "known",
    refs: ["I Samuel 17"],
    story: {
      en: "Two armies on two ridges and a stream between them. David chose five smooth stones from the brook.",
      he: "שני צבאות על שני רכסים ונחל ביניהם. דוד בחר חמישה חלוקי אבנים מן הנחל.",
    },
  },
  {
    id: "bethlehem", en: "Bethlehem", he: "בית לחם", lat: 31.7049, lng: 35.2023, zoom: 14, certainty: "known",
    refs: ["Ruth 1", "Ruth 4", "I Samuel 16", "Micah 5"],
    story: {
      en: "Ruth's fields. Samuel anoints the youngest son, the shepherd David.",
      he: "השדות של רות. שמואל מושח את הבן הצעיר, דוד הרועה.",
    },
  },
  {
    id: "hebron", en: "Hebron", he: "חברון", lat: 31.5247, lng: 35.1108, zoom: 14, certainty: "known",
    refs: ["Genesis 23", "Genesis 13", "II Samuel 2", "II Samuel 5"],
    story: {
      en: "Abraham buys the cave of Machpelah. David reigns here seven and a half years before Jerusalem.",
      he: "אברהם קונה את מערת המכפלה. דוד מולך כאן שבע שנים וחצי לפני ירושלים.",
    },
  },
  {
    id: "cityofdavid", en: "City of David, Jerusalem", he: "עיר דוד, ירושלים", lat: 31.774, lng: 35.2357, zoom: 15.5, certainty: "known",
    refs: ["II Samuel 5", "II Samuel 6", "II Samuel 11", "I Kings 1"],
    story: {
      en: "David takes the stronghold of Zion and dances before the Ark. From a rooftop here he sees Bathsheba.",
      he: "דוד כובש את מצודת ציון ומרקד לפני הארון. מגג הארמון הוא רואה את בת שבע.",
    },
  },
  {
    id: "moriah", en: "Mount Moriah", he: "הר המוריה", lat: 31.778, lng: 35.2354, zoom: 15.5, certainty: "traditional",
    refs: ["Genesis 22", "II Samuel 24", "II Chronicles 3"],
    story: {
      en: "The binding of Isaac. David buys Araunah's threshing floor, and Solomon builds the Temple there.",
      he: "עקדת יצחק. דוד קונה את גורן ארוונה, ושלמה בונה שם את המקדש.",
    },
  },
  {
    id: "eingedi", en: "Ein Gedi", he: "עין גדי", lat: 31.4607, lng: 35.387, zoom: 13.5, certainty: "known",
    refs: ["I Samuel 24", "Song of Songs 1"],
    story: {
      en: "In a cave above the Dead Sea, David cuts the corner of Saul's robe and lets him live.",
      he: "במערה מעל ים המלח דוד כורת את כנף מעיל שאול ומשאיר אותו בחיים.",
    },
  },
  {
    id: "adullam", en: "Cave of Adullam", he: "מערת עדולם", lat: 31.6497, lng: 34.9839, zoom: 13.5, certainty: "known",
    refs: ["I Samuel 22", "II Samuel 23"],
    story: {
      en: "David the fugitive. Everyone in distress, in debt or bitter of soul gathers to him, about four hundred men.",
      he: "דוד הנרדף. כל איש מצוק, כל נושה וכל מר נפש מתקבצים אליו, כארבע מאות איש.",
    },
  },
  {
    id: "gibeah", en: "Gibeah of Saul", he: "גבעת שאול", lat: 31.8239, lng: 35.2311, zoom: 14.5, certainty: "known",
    refs: ["I Samuel 10", "I Samuel 15", "Judges 19"],
    story: {
      en: "Saul's hometown and first royal seat.",
      he: "עיר הולדתו של שאול ובירתו הראשונה.",
    },
  },
  {
    id: "ramah", en: "Ramah, Samuel's town", he: "הרמה, עירו של שמואל", lat: 31.85, lng: 35.2333, zoom: 14, certainty: "debated",
    refs: ["I Samuel 1", "I Samuel 7", "I Samuel 25"],
    story: {
      en: "Hannah's prayer was answered with Samuel, who judged Israel from his home here.",
      he: "תפילת חנה נענתה בשמואל, ששפט את ישראל מביתו כאן.",
    },
  },
  {
    id: "shiloh", en: "Shiloh", he: "שילה", lat: 32.0556, lng: 35.2894, zoom: 14.5, certainty: "known",
    refs: ["I Samuel 1", "I Samuel 3", "Joshua 18"],
    story: {
      en: "The Tabernacle stood here. Hannah prays, and the boy Samuel hears a voice in the night.",
      he: "כאן עמד המשכן. חנה מתפללת, והנער שמואל שומע קול בלילה.",
    },
  },
  {
    id: "mizpah", en: "Mizpah", he: "המצפה", lat: 31.8867, lng: 35.2161, zoom: 14, certainty: "known",
    refs: ["I Samuel 7", "I Samuel 10"],
    story: {
      en: "Saul is chosen by lot, and found hiding among the baggage.",
      he: "שאול נבחר בגורל, ונמצא נחבא אל הכלים.",
    },
  },
  {
    id: "michmash", en: "Michmash pass", he: "מעבר מכמש", lat: 31.8714, lng: 35.2764, zoom: 14, certainty: "known",
    refs: ["I Samuel 13", "I Samuel 14"],
    story: {
      en: "Jonathan and his armor-bearer climb the cliffs between two crags, Bozez and Seneh.",
      he: "יונתן ונושא כליו מטפסים על הצוקים בין שתי שני הסלע, בוצץ וסנה.",
    },
  },
  {
    id: "gibeon", en: "Gibeon", he: "גבעון", lat: 31.8472, lng: 35.185, zoom: 14, certainty: "known",
    refs: ["Joshua 9", "Joshua 10", "II Samuel 2", "I Kings 3"],
    story: {
      en: "“Sun, stand still upon Gibeon.” The pool where the young men fought, and the place of Solomon's dream.",
      he: "״שמש בגבעון דום״. הבריכה שבה נלחמו הנערים, והמקום שבו חלם שלמה.",
    },
  },
  {
    id: "aijalon", en: "Valley of Aijalon", he: "עמק איילון", lat: 31.84, lng: 34.98, zoom: 12.5, certainty: "known",
    refs: ["Joshua 10", "I Samuel 14"],
    story: {
      en: "“…and you, moon, in the valley of Aijalon.”",
      he: "״…וירח בעמק אילון״.",
    },
  },
  {
    id: "kiriathjearim", en: "Kiriath-jearim", he: "קרית יערים", lat: 31.8069, lng: 35.1031, zoom: 14.5, certainty: "known",
    refs: ["I Samuel 7", "II Samuel 6"],
    story: {
      en: "The Ark rested here twenty years before David brought it up to Jerusalem.",
      he: "הארון שהה כאן עשרים שנה עד שדוד העלה אותו לירושלים.",
    },
  },
  {
    id: "bethshemesh", en: "Beth-shemesh", he: "בית שמש", lat: 31.7522, lng: 34.9758, zoom: 14, certainty: "known",
    refs: ["I Samuel 6"],
    story: {
      en: "Two milk cows pull the Ark home from Philistia, lowing as they go.",
      he: "שתי פרות עלות מושכות את הארון בחזרה מארץ פלשתים, הלוך וגעו.",
    },
  },
  {
    id: "zorah", en: "Zorah", he: "צרעה", lat: 31.7731, lng: 34.9836, zoom: 14, certainty: "known",
    refs: ["Judges 13", "Judges 16"],
    story: {
      en: "Samson's birthplace, between Zorah and Eshtaol.",
      he: "מקום הולדתו של שמשון, בין צרעה ובין אשתאול.",
    },
  },
  {
    id: "gath", en: "Gath (Tell es-Safi)", he: "גת (תל צפית)", lat: 31.7, lng: 34.8458, zoom: 14, certainty: "known",
    refs: ["I Samuel 17", "I Samuel 21", "I Samuel 27"],
    story: {
      en: "Goliath's city. Later David fled here and pretended to be mad before King Achish.",
      he: "עירו של גלית. מאוחר יותר דוד ברח לכאן והשתגע לעיני אכיש מלך גת.",
    },
  },
  {
    id: "ashdod", en: "Ashdod", he: "אשדוד", lat: 31.7547, lng: 34.6597, zoom: 14, certainty: "known",
    refs: ["I Samuel 5"],
    story: {
      en: "The captured Ark in Dagon's temple. Each morning the idol is found fallen on its face.",
      he: "הארון השבוי בבית דגון. בכל בוקר נמצא הפסל נופל על פניו.",
    },
  },
  {
    id: "gaza", en: "Gaza (ancient)", he: "עזה (העתיקה)", lat: 31.505, lng: 34.4645, zoom: 13, certainty: "known",
    refs: ["Judges 16"],
    story: {
      en: "Samson carries off the city gates. At the end he brings down the house of Dagon.",
      he: "שמשון עוקר את דלתות שער העיר. בסוף הוא מפיל את בית דגון.",
    },
  },
  {
    id: "lachish", en: "Lachish", he: "לכיש", lat: 31.565, lng: 34.8489, zoom: 14.5, certainty: "known",
    refs: ["II Kings 18", "Jeremiah 34"],
    story: {
      en: "Judah's second city, besieged by Sennacherib.",
      he: "העיר השנייה בחשיבותה ביהודה, שסנחריב צר עליה.",
    },
  },
  {
    id: "tekoa", en: "Tekoa", he: "תקוע", lat: 31.6361, lng: 35.2172, zoom: 14, certainty: "known",
    refs: ["Amos 1", "II Samuel 14"],
    story: {
      en: "Home of Amos the herdsman, and of the wise woman Joab sent to David.",
      he: "עירו של עמוס הנוקד, ושל האשה החכמה שיואב שלח אל דוד.",
    },
  },
  {
    id: "anathoth", en: "Anathoth", he: "ענתות", lat: 31.8117, lng: 35.2603, zoom: 14.5, certainty: "known",
    refs: ["Jeremiah 1", "Jeremiah 32"],
    story: {
      en: "Jeremiah's village. With Jerusalem under siege, he buys a field here as a sign of hope.",
      he: "הכפר של ירמיהו. כשירושלים במצור הוא קונה כאן שדה, לאות תקווה.",
    },
  },
  {
    id: "carmeljudah", en: "Carmel of Judah", he: "כרמל שביהודה", lat: 31.4253, lng: 35.1347, zoom: 14, certainty: "known",
    refs: ["I Samuel 25"],
    story: {
      en: "Nabal's sheep-shearing. Abigail rides out with bread and wine and stops David's anger.",
      he: "גז הצאן של נבל. אביגיל רוכבת לקראת דוד עם לחם ויין ועוצרת את זעמו.",
    },
  },
  {
    id: "beersheba", en: "Beersheba", he: "באר שבע", lat: 31.2453, lng: 34.8406, zoom: 14, certainty: "known",
    refs: ["Genesis 21", "Genesis 26", "Genesis 46", "I Kings 19"],
    story: {
      en: "Abraham's well and his oath with Abimelech. Elijah flees from here into the desert.",
      he: "הבאר של אברהם והשבועה עם אבימלך. מכאן אליהו בורח אל המדבר.",
    },
  },
  {
    id: "arad", en: "Arad", he: "ערד", lat: 31.2808, lng: 35.1261, zoom: 14.5, certainty: "known",
    refs: ["Numbers 21"],
    story: { en: "The king of Arad attacks Israel on the way of Atharim.", he: "מלך ערד נלחם בישראל בדרך האתרים." },
  },
  // ── The Jordan, Jericho and the center ───────────────────────────
  {
    id: "jericho", en: "Jericho", he: "יריחו", lat: 31.8711, lng: 35.444, zoom: 14.5, certainty: "known",
    refs: ["Joshua 2", "Joshua 6", "II Kings 2"],
    story: {
      en: "Rahab's scarlet cord, and walls that fall at the sound of the shofar.",
      he: "חוט השני של רחב, וחומות שנופלות לקול השופר.",
    },
  },
  {
    id: "jordan", en: "Jordan crossing", he: "מעבר הירדן", lat: 31.8381, lng: 35.5397, zoom: 13.5, certainty: "traditional",
    refs: ["Joshua 3", "II Kings 2", "II Kings 5"],
    story: {
      en: "The river stops for the Ark. Elijah rises in a whirlwind, and Naaman dips seven times.",
      he: "הנהר נעצר מפני הארון. אליהו עולה בסערה, ונעמן טובל שבע פעמים.",
    },
  },
  {
    id: "shechem", en: "Shechem", he: "שכם", lat: 32.2136, lng: 35.2817, zoom: 13.5, certainty: "known",
    refs: ["Genesis 12", "Genesis 34", "Joshua 24", "I Kings 12"],
    story: {
      en: "Abraham's first altar in the land. Joshua's covenant. The kingdom splits in two here.",
      he: "המזבח הראשון של אברהם בארץ. ברית יהושע. כאן הממלכה מתפצלת לשתיים.",
    },
  },
  {
    id: "gerizim", en: "Mount Gerizim & Mount Ebal", he: "הר גריזים והר עיבל", lat: 32.2165, lng: 35.273, zoom: 12.5, certainty: "known",
    refs: ["Deuteronomy 11", "Deuteronomy 27", "Joshua 8", "Judges 9"],
    story: {
      en: "Blessing from one mountain and curse from the other, with all Israel in the valley between.",
      he: "ברכה מהר אחד וקללה מן השני, וכל ישראל בעמק שביניהם.",
    },
  },
  {
    id: "bethel", en: "Bethel", he: "בית אל", lat: 31.9264, lng: 35.2389, zoom: 14, certainty: "known",
    refs: ["Genesis 28", "Genesis 35", "I Kings 12"],
    story: {
      en: "Jacob's ladder. “Surely the LORD is in this place, and I did not know it.”",
      he: "סולם יעקב. ״אכן יש ה׳ במקום הזה ואנכי לא ידעתי״.",
    },
  },
  {
    id: "samaria", en: "Samaria (Sebastia)", he: "שומרון (סבסטיה)", lat: 32.2761, lng: 35.1953, zoom: 14.5, certainty: "known",
    refs: ["I Kings 16", "II Kings 6", "II Kings 17"],
    story: {
      en: "Omri buys a hill and builds a capital. A great siege and four lepers at the gate.",
      he: "עמרי קונה הר ובונה עליו בירה. מצור גדול, וארבעה מצורעים בפתח השער.",
    },
  },
  {
    id: "jabbok", en: "Jabbok river (Penuel)", he: "נחל יבוק (פניאל)", lat: 32.18, lng: 35.67, zoom: 12.5, certainty: "debated",
    refs: ["Genesis 32", "Judges 8"],
    story: {
      en: "Jacob wrestles until dawn and is given a new name, Israel.",
      he: "יעקב נאבק עד עלות השחר ומקבל שם חדש, ישראל.",
    },
  },
  {
    id: "nebo", en: "Mount Nebo", he: "הר נבו", lat: 31.768, lng: 35.7256, zoom: 12.5, certainty: "traditional",
    refs: ["Deuteronomy 32", "Deuteronomy 34"],
    story: {
      en: "Moses looks out over the whole land he will not enter.",
      he: "משה משקיף על כל הארץ שאליה לא ייכנס.",
    },
  },
  {
    id: "sodom", en: "Mount Sodom", he: "הר סדום", lat: 31.08, lng: 35.39, zoom: 12.5, certainty: "traditional",
    refs: ["Genesis 18", "Genesis 19"],
    story: {
      en: "Abraham bargains for the cities. Lot's wife looks back.",
      he: "אברהם מתמקח על הערים. אשת לוט מביטה לאחור.",
    },
  },
  // ── The north ────────────────────────────────────────────────────
  {
    id: "kinneret", en: "Sea of Galilee (Kinneret)", he: "ים כנרת", lat: 32.82, lng: 35.59, zoom: 10.5, certainty: "known",
    refs: ["Numbers 34", "Joshua 13"],
    story: { en: "Part of the eastern border of the land.", he: "חלק מגבול הארץ במזרח." },
  },
  {
    id: "hazor", en: "Hazor", he: "חצור", lat: 33.0172, lng: 35.5681, zoom: 14, certainty: "known",
    refs: ["Joshua 11", "Judges 4", "I Kings 9"],
    story: { en: "“The head of all those kingdoms,” burned by Joshua.", he: "״ראש כל הממלכות האלה״, שיהושע שרף." },
  },
  {
    id: "dan", en: "Tel Dan", he: "תל דן", lat: 33.2486, lng: 35.6522, zoom: 14, certainty: "known",
    refs: ["Judges 18", "I Kings 12"],
    story: {
      en: "The northern edge, “from Dan to Beersheba.” Jeroboam sets a golden calf here.",
      he: "הקצה הצפוני, ״מדן ועד באר שבע״. ירבעם מציב כאן עגל זהב.",
    },
  },
  {
    id: "hermon", en: "Mount Hermon", he: "הר חרמון", lat: 33.4164, lng: 35.8572, zoom: 11.5, certainty: "known",
    refs: ["Psalms 133", "Deuteronomy 3"],
    story: {
      en: "“Like the dew of Hermon that falls on the mountains of Zion.”",
      he: "״כטל חרמון שיורד על הררי ציון״.",
    },
  },
  // ── Wilderness and Egypt ──────────────────────────────────────────
  {
    id: "sinai", en: "Mount Sinai (Jebel Musa)", he: "הר סיני (ג׳בל מוסא)", lat: 28.5392, lng: 33.9753, zoom: 12.5, certainty: "traditional",
    refs: ["Exodus 19", "Exodus 20", "Exodus 34", "I Kings 19"],
    story: {
      en: "Thunder, a shofar blast, the Ten Words. Centuries later Elijah hears a still small voice.",
      he: "קולות וברקים, קול שופר ועשרת הדברות. מאות שנים אחר כך אליהו שומע קול דממה דקה.",
    },
  },
  {
    id: "kadesh", en: "Kadesh-barnea", he: "קדש ברנע", lat: 30.6494, lng: 34.4244, zoom: 13, certainty: "debated",
    refs: ["Numbers 13", "Numbers 20"],
    story: {
      en: "The spies set out from here. Miriam dies and Moses strikes the rock.",
      he: "מכאן יצאו המרגלים. מרים מתה ומשה מכה בסלע.",
    },
  },
  {
    id: "goshen", en: "Land of Goshen", he: "ארץ גושן", lat: 30.55, lng: 31.95, zoom: 9.5, certainty: "debated",
    refs: ["Genesis 45", "Genesis 47", "Exodus 8"],
    story: {
      en: "Jacob's family settles in Egypt's eastern delta.",
      he: "משפחת יעקב מתיישבת במזרח הדלתא של מצרים.",
    },
  },
  {
    id: "eziongeber", en: "Ezion-geber (Gulf of Eilat)", he: "עציון גבר (מפרץ אילת)", lat: 29.55, lng: 34.95, zoom: 11.5, certainty: "debated",
    refs: ["I Kings 9", "Numbers 33"],
    story: {
      en: "Solomon's fleet sails from here to Ophir for gold.",
      he: "מכאן הפליג הצי של שלמה לאופיר להביא זהב.",
    },
  },
  // ── Mesopotamia and Persia ───────────────────────────────────────
  {
    id: "ur", en: "Ur", he: "אור כשדים", lat: 30.9625, lng: 46.1031, zoom: 13, certainty: "traditional",
    refs: ["Genesis 11", "Genesis 15"],
    story: { en: "Where Abram's journey begins.", he: "המקום שממנו מתחיל המסע של אברם." },
  },
  {
    id: "haran", en: "Haran", he: "חרן", lat: 36.8653, lng: 39.0317, zoom: 12.5, certainty: "known",
    refs: ["Genesis 11", "Genesis 12", "Genesis 29"],
    story: {
      en: "“Go forth from your land.” Later, Jacob meets Rachel at a well nearby.",
      he: "״לך לך מארצך״. לימים יעקב פוגש את רחל ליד באר בסביבה.",
    },
  },
  {
    id: "ararat", en: "Mount Ararat", he: "הר אררט", lat: 39.7017, lng: 44.2983, zoom: 10.5, certainty: "traditional",
    refs: ["Genesis 8"],
    story: {
      en: "The ark comes to rest “on the mountains of Ararat.”",
      he: "התיבה נחה ״על הרי אררט״.",
    },
  },
  {
    id: "nineveh", en: "Nineveh", he: "נינוה", lat: 36.3594, lng: 43.1533, zoom: 12.5, certainty: "known",
    refs: ["Jonah 1", "Jonah 3", "Jonah 4", "Nahum 1"],
    story: {
      en: "The great city Jonah ran from, “with more than 120,000 people… and many animals.”",
      he: "העיר הגדולה שיונה ברח ממנה, ״אשר יש בה הרבה משתים עשרה רבו אדם… ובהמה רבה״.",
    },
  },
  {
    id: "babylon", en: "Babylon", he: "בבל", lat: 32.5364, lng: 44.4208, zoom: 13, certainty: "known",
    refs: ["Genesis 11", "II Kings 25", "Psalms 137", "Daniel 5"],
    story: {
      en: "The tower. The exile. “By the rivers of Babylon we sat and wept.” Writing on the wall.",
      he: "המגדל. הגלות. ״על נהרות בבל שם ישבנו גם בכינו״. כתובת על הקיר.",
    },
  },
  {
    id: "susa", en: "Shushan (Susa)", he: "שושן הבירה", lat: 32.1894, lng: 48.2578, zoom: 13.5, certainty: "known",
    refs: ["Esther 1", "Esther 4", "Nehemiah 1", "Daniel 8"],
    story: {
      en: "Esther's palace. “Who knows whether you came to royalty for such a time as this?”",
      he: "הארמון של אסתר. ״ומי יודע אם לעת כזאת הגעת למלכות״.",
    },
  },
];

const byId = new Map(PLACES.map((p) => [p.id, p]));
export const findPlace = (id: string | null | undefined) => (id ? byId.get(id) : undefined);

/** Places whose stories touch a given chapter, e.g. "I Samuel 31". */
export function placesForChapter(book: string, chapter: number): Place[] {
  const key = `${book} ${chapter}`;
  return PLACES.filter((p) => p.refs.includes(key));
}
