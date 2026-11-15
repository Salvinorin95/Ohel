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
  /** A smaller place right next to a bigger one: its dot and label give way first when the map is crowded. */
  minor?: boolean;
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
  {
    id: "kishon", en: "Kishon Brook", he: "נחל קישון", lat: 32.6475, lng: 35.1613, zoom: 11.5, certainty: "known",
    refs: ["Judges 4", "Judges 5", "I Kings 18", "Psalms 83"],
    story: {
      en: "Deborah's song: “the ancient stream, the stream Kishon” swept Sisera's chariots away. After the fire fell on Carmel, Elijah led the prophets of Baal down to its banks.",
      he: "שירת דבורה: ״נחל קישון גרפם״, ורכב סיסרא נסחף. אחרי שירדה אש בכרמל, הוריד אליהו את נביאי הבעל אל גדותיו.",
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
  {
    id: "olives", en: "Mount of Olives", he: "הר הזיתים", lat: 31.7789, lng: 35.2439, zoom: 14.5, certainty: "known",
    refs: ["II Samuel 15", "I Kings 11", "Ezekiel 11", "Zechariah 14"],
    story: {
      en: "David climbs it barefoot and weeping as he flees Absalom. In Zechariah's vision the LORD's feet stand here and the mountain splits in two.",
      he: "דוד עולה בו יחף ובוכה בבריחתו מפני אבשלום. בחזון זכריה רגלי ה׳ עומדות עליו וההר נבקע לשניים.",
    },
  },
  {
    id: "kidron", en: "Kidron Valley", he: "נחל קדרון", lat: 31.7752, lng: 35.2387, zoom: 14, certainty: "known",
    refs: ["II Samuel 15", "I Kings 15", "II Kings 23", "Jeremiah 31"],
    story: {
      en: "David crosses it in tears as he flees Absalom. Kings of Judah burn idols in it, and Jerusalem's nobles carve their tombs in its rock.",
      he: "דוד חוצה אותו בבכי בבריחתו מאבשלום. מלכי יהודה שורפים בו אלילים, ונכבדי ירושלים חוצבים בסלעו את קבריהם.",
    },
  },
  {
    id: "hinnom", en: "Valley of Hinnom", he: "גיא בן הינום", lat: 31.7695, lng: 35.2305, zoom: 14.5, certainty: "known",
    refs: ["Joshua 15", "II Kings 23", "Jeremiah 7", "Jeremiah 19"],
    story: {
      en: "The Tophet, where children were passed through fire, stood here, and Jeremiah renamed it the Valley of Slaughter. Its name became Gehenna.",
      he: "כאן עמד התופת שבו העבירו ילדים באש, וירמיהו קרא לו ״גיא ההרגה״. משמו נולדה המילה ״גיהנום״.",
    },
  },
  {
    id: "rephaim", en: "Valley of Rephaim", he: "עמק רפאים", lat: 31.75, lng: 35.195, zoom: 13, certainty: "known",
    refs: ["II Samuel 5", "II Samuel 23", "Isaiah 17"],
    story: {
      en: "Twice the Philistines spread out in the valley, and twice David beat them, once at the sound of marching in the treetops.",
      he: "פעמיים פשטו הפלשתים בעמק ופעמיים הכה אותם דוד, פעם אחת לקול צעדה בראשי הבכאים.",
    },
  },
  {
    id: "mamre", en: "Oaks of Mamre", he: "אלוני ממרא", lat: 31.5565, lng: 35.1053, zoom: 14, certainty: "traditional",
    refs: ["Genesis 13", "Genesis 14", "Genesis 18", "Genesis 23"],
    story: {
      en: "Sitting at his tent door in the heat of the day, Abraham sees three strangers, runs to meet them and feeds them. They promise Sarah a son.",
      he: "אברהם יושב בפתח האוהל כחום היום, רואה שלושה זרים, רץ לקראתם ומאכיל אותם. הם מבשרים לשרה על בן.",
    },
  },
  {
    id: "ai", en: "Ai (et-Tell)", he: "העי (א־תל)", lat: 31.9165, lng: 35.2615, zoom: 14, certainty: "debated",
    refs: ["Genesis 12", "Joshua 7", "Joshua 8"],
    story: {
      en: "Achan's stolen treasure brings defeat; then Joshua's ambush takes the town and burns it to a heap. The mound was already an ancient ruin.",
      he: "השלל שגנב עכן מביא תבוסה, ואז המארב של יהושע כובש את העיר ושורף אותה לתל. התל היה כבר אז חורבה עתיקה.",
    },
  },
  {
    id: "gerar", en: "Gerar", he: "גרר", lat: 31.3821, lng: 34.6065, zoom: 13.5, certainty: "debated",
    refs: ["Genesis 20", "Genesis 26", "II Chronicles 14"],
    story: {
      en: "Abraham and Isaac live here under King Abimelech. Isaac's men dig wells, quarrel over Esek and Sitnah, and at last find Rehoboth, with room for all.",
      he: "אברהם ויצחק גרים כאן תחת אבימלך. עבדי יצחק חופרים בארות, רבים על עשק ושטנה, ולבסוף מוצאים את רחובות.",
    },
  },
  {
    id: "ziklag", en: "Ziklag", he: "צקלג", lat: 31.3912, lng: 34.6816, zoom: 13.5, certainty: "debated",
    refs: ["I Samuel 27", "I Samuel 30", "II Samuel 1"],
    story: {
      en: "Achish gives David this Negev town. Amalekites burn it while he is away; David rides them down and brings every captive home.",
      he: "אכיש נותן לדוד את העיירה שבנגב. העמלקים שורפים אותה בהיעדרו, ודוד רודף אחריהם ומחזיר את כל השבויים.",
    },
  },
  {
    id: "azekah", en: "Azekah", he: "עזקה", lat: 31.701, lng: 34.9357, zoom: 14, certainty: "known",
    refs: ["Joshua 10", "I Samuel 17", "Jeremiah 34", "Nehemiah 11"],
    story: {
      en: "A hilltop fortress above the Valley of Elah. Joshua’s hailstones fell “as far as Azekah”, and in Judah’s last days an officer wrote that he could no longer see it.",
      he: "מבצר על גבעה מעל עמק האלה. אבני הברד של יהושע ירדו ״עד עזקה״, ובימיה האחרונים של יהודה כתב קצין: ״לא נראה את עזקה״.",
    },
  },
  {
    id: "gezer", en: "Gezer", he: "גזר", lat: 31.8599, lng: 34.9196, zoom: 14, certainty: "known",
    refs: ["Joshua 10", "Joshua 16", "Judges 1", "I Kings 9"],
    story: {
      en: "A Canaanite city on the road from the coast to Jerusalem. Pharaoh burned it and gave it to his daughter, Solomon’s wife, and Solomon rebuilt it.",
      he: "עיר כנענית על הדרך מן החוף לירושלים. פרעה שרף אותה ונתן אותה לבתו, אשת שלמה, ושלמה בנה אותה מחדש.",
    },
  },
  {
    id: "timnah", en: "Timnah (Tel Batash)", he: "תמנה (תל בטש)", lat: 31.7864, lng: 34.9108, zoom: 14, certainty: "known",
    refs: ["Judges 14", "Judges 15", "Joshua 15", "II Chronicles 28"],
    story: {
      en: "A Philistine town in the Sorek Valley. On the way to his bride here Samson tore apart a lion, and at the wedding feast he set his famous riddle.",
      he: "עיר פלשתית בעמק שורק. בדרך אל כלתו שבה קרע שמשון אריה, ובמשתה החתונה חד את חידתו המפורסמת.",
    },
  },
  {
    id: "ekron", en: "Ekron (Tel Miqne)", he: "עקרון (תל מקנה)", lat: 31.7789, lng: 34.8511, zoom: 14, certainty: "known",
    refs: ["I Samuel 5", "I Samuel 6", "II Kings 1", "Zephaniah 2"],
    story: {
      en: "The Philistine city nearest Judah. The captured Ark was sent here last, and a king of Israel sent to ask its god, Baal-zebub, if he would live.",
      he: "עיר הפלשתים הקרובה ביותר ליהודה. לכאן נשלח הארון השבוי באחרונה, ואל אלוהיה, בעל זבוב, שלח מלך ישראל לשאול אם יחיה.",
    },
  },
  {
    id: "ashkelon", en: "Ashkelon", he: "אשקלון", lat: 31.6619, lng: 34.5461, zoom: 13.5, certainty: "known",
    refs: ["Judges 14", "II Samuel 1", "Jeremiah 47", "Zephaniah 2"],
    story: {
      en: "A great Philistine port by the sea. “Tell it not in Gath, publish it not in the streets of Ashkelon,” David lamented over Saul.",
      he: "נמל פלשתי גדול לחוף הים. ״אל תגידו בגת, אל תבשרו בחוצת אשקלון״, קונן דוד על שאול.",
    },
  },
  {
    id: "joppa", en: "Joppa (Jaffa)", he: "יפו", lat: 32.0545, lng: 34.7517, zoom: 14, certainty: "known",
    refs: ["Jonah 1", "II Chronicles 2", "Ezra 3", "Joshua 19"],
    story: {
      en: "An ancient port on a rocky hill. Jonah went down to Joppa to flee by ship to Tarshish, and Lebanon’s cedars came ashore here for both Temples.",
      he: "נמל עתיק על גבעת סלע. יונה ירד ליפו כדי לברוח באונייה תרשישה, ודרכה הגיעו ארזי הלבנון לשני בתי המקדש.",
    },
  },
  {
    id: "aphek", en: "Aphek and Ebenezer", he: "אפק ואבן העזר", lat: 32.105, lng: 34.9304, zoom: 13.5, certainty: "known",
    refs: ["I Samuel 4", "I Samuel 5", "I Samuel 29", "Joshua 12"],
    story: {
      en: "The Philistines camped at Aphek, by the springs of the Yarkon, and Israel at Ebenezer. Israel lost, and the Ark of the Covenant was captured.",
      he: "הפלשתים חנו באפק, ליד מעיינות הירקון, וישראל באבן העזר. ישראל הובסו, וארון הברית נשבה.",
    },
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
  {
    id: "gilgal", en: "Gilgal", he: "הגלגל", lat: 31.845, lng: 35.48, zoom: 12.5, certainty: "debated",
    refs: ["Joshua 4", "Joshua 5", "I Samuel 11", "I Samuel 15", "II Kings 2"],
    story: {
      en: "Israel's first camp across the Jordan: twelve stones from the river and the first Passover in the land. Later Saul is made king here.",
      he: "המחנה הראשון מעבר לירדן: שתים עשרה אבנים מן הנהר והפסח הראשון בארץ. לימים מומלך כאן שאול.",
    },
  },
  {
    id: "shittim", en: "Shittim (Abel-shittim)", he: "שיטים (אבל השיטים)", lat: 31.8402, lng: 35.6737, zoom: 13, certainty: "debated",
    refs: ["Numbers 25", "Numbers 33", "Joshua 2", "Joshua 3", "Micah 6"],
    story: {
      en: "Israel's last camp before the Jordan. The people go astray after Baal-peor, and from here Joshua sends two spies to Jericho.",
      he: "המחנה האחרון לפני הירדן. העם חוטא בבעל פעור, ומכאן שולח יהושע שני מרגלים ליריחו.",
    },
  },
  {
    id: "deadsea", en: "Dead Sea (Salt Sea)", he: "ים המלח", lat: 31.5536, lng: 35.4867, zoom: 10, certainty: "known",
    refs: ["Genesis 14", "Numbers 34", "Joshua 3", "Ezekiel 47", "Zechariah 14"],
    story: {
      en: "The Salt Sea, the lowest land on Earth. Ezekiel sees its water healed, with fishermen spreading nets from Ein Gedi.",
      he: "ים המלח, המקום הנמוך ביותר ביבשה. יחזקאל רואה את מימיו נרפאים, ודייגים פורשים רשתות מעין גדי.",
    },
  },
  {
    id: "tirzah", en: "Tirzah", he: "תרצה", lat: 32.2874, lng: 35.3378, zoom: 14, certainty: "known",
    refs: ["I Kings 14", "I Kings 15", "I Kings 16", "Song of Songs 6"],
    story: {
      en: "An early royal city of the northern kingdom. Zimri reigned here seven days, then burned the palace over himself as Omri besieged the town.",
      he: "עיר מלכות מוקדמת של ממלכת ישראל. זמרי מלך בה שבעה ימים, ואז שרף עליו את הארמון כשעמרי צר על העיר.",
    },
  },
  {
    id: "dothan", en: "Dothan", he: "דותן", lat: 32.4135, lng: 35.2399, zoom: 14, certainty: "known",
    refs: ["Genesis 37", "II Kings 6"],
    story: {
      en: "Joseph’s brothers threw him into a pit near Dothan and sold him to a caravan. Later the hills here were full of fiery chariots around Elisha.",
      he: "ליד דותן השליכו אחי יוסף אותו לבור ומכרו אותו לשיירה. לימים התמלאו ההרים כאן סוסים ורכב אש סביב אלישע.",
    },
  },
  {
    id: "ebal", en: "Mount Ebal", he: "הר עיבל", lat: 32.234, lng: 35.2733, zoom: 13, certainty: "known",
    refs: ["Deuteronomy 11", "Deuteronomy 27", "Joshua 8"],
    story: {
      en: "The mountain of the curse, facing Gerizim across Shechem’s valley. Joshua built an altar of uncut stones here, and on a spur of it stands a structure some call his altar.",
      he: "הר הקללה, מול גריזים מעבר לעמק שכם. יהושע בנה כאן מזבח אבנים שלמות, ועל אחת משלוחותיו עומד מבנה שיש המכנים אותו מזבח יהושע.",
    },
  },
  {
    id: "mahanaim", en: "Mahanaim", he: "מחנים", lat: 32.1856, lng: 35.6866, zoom: 13, certainty: "debated",
    refs: ["Genesis 32", "II Samuel 2", "II Samuel 17", "II Samuel 19", "I Kings 4"],
    story: {
      en: "Jacob meets God's angels and names the place “two camps.” Later David waits here at the gate and weeps for Absalom.",
      he: "יעקב פוגש מלאכי אלוהים וקורא למקום ״מחנים״. לימים דוד מחכה כאן בשער ובוכה על אבשלום.",
    },
  },
  {
    id: "ramothgilead", en: "Ramoth-gilead", he: "רמות גלעד", lat: 32.5, lng: 36.0147, zoom: 12.5, certainty: "debated",
    refs: ["Deuteronomy 4", "I Kings 22", "II Kings 8", "II Kings 9"],
    story: {
      en: "A city of refuge that Israel and Aram fought over. Ahab dies from a stray arrow, and a young prophet anoints Jehu king.",
      he: "עיר מקלט שעליה נלחמו ישראל וארם. אחאב נהרג מחץ תועה, ונער מבני הנביאים מושח את יהוא למלך.",
    },
  },
  {
    id: "rabbah", en: "Rabbah of the Ammonites", he: "רבת בני עמון", lat: 31.9547, lng: 35.9343, zoom: 14.5, certainty: "known",
    refs: ["Deuteronomy 3", "II Samuel 11", "II Samuel 12", "Jeremiah 49", "Amos 1"],
    story: {
      en: "Capital of the Ammonites, today's Amman. Joab besieges it, and Uriah the Hittite falls beneath its walls.",
      he: "בירת בני עמון, עמאן של היום. יואב צר עליה, ואוריה החתי נופל תחת חומותיה.",
    },
  },
  {
    id: "heshbon", en: "Heshbon", he: "חשבון", lat: 31.8008, lng: 35.8089, zoom: 14, certainty: "debated",
    refs: ["Numbers 21", "Numbers 32", "Isaiah 15", "Jeremiah 48", "Song of Songs 7"],
    story: {
      en: "Sihon's city, taken on the way to the Jordan. “Your eyes are pools in Heshbon.”",
      he: "עירו של סיחון, שנכבשה בדרך אל הירדן. ״עיניך ברכות בחשבון״.",
    },
  },
  {
    id: "dibon", en: "Dibon (Dhiban)", he: "דיבון (ד׳יבאן)", lat: 31.4992, lng: 35.7805, zoom: 14, certainty: "known",
    refs: ["Numbers 21", "Numbers 32", "II Kings 3", "Isaiah 15", "Jeremiah 48"],
    story: {
      en: "Home of Mesha king of Moab, who rebelled against Israel. His victory stone was found here in 1868.",
      he: "עירו של מישע מלך מואב, שמרד בישראל. אבן הניצחון שלו נמצאה כאן ב־1868.",
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
  {
    id: "kedesh", en: "Kedesh in Naphtali", he: "קדש נפתלי", lat: 33.1117, lng: 35.5294, zoom: 14, certainty: "known",
    refs: ["Joshua 20", "Judges 4", "II Kings 15"],
    story: {
      en: "A city of refuge in the hills of Naphtali and Barak's hometown. Tiglath-pileser took it; centuries later a burnt archive here left 2,000 clay seals.",
      he: "עיר מקלט בהר נפתלי ועירו של ברק. תגלת פלאסר כבש אותה, ומאות שנים אחר כך הותיר בה ארכיון שרוף 2,000 חותמות טין.",
    },
  },
  {
    id: "tyre", en: "Tyre", he: "צור", lat: 33.2721, lng: 35.1955, zoom: 13, certainty: "known",
    refs: ["II Samuel 5", "I Kings 5", "Isaiah 23", "Ezekiel 27", "Amos 1"],
    story: {
      en: "Island city of merchants. King Hiram sent cedar to David and Solomon; Ezekiel mourned its pride, and Alexander built a causeway to take it.",
      he: "עיר אי של סוחרים. חירם שלח ארזים לדוד ולשלמה, יחזקאל קונן על גאוותה, ואלכסנדר בנה סוללה כדי לכבוש אותה.",
    },
  },
  {
    id: "sidon", en: "Sidon", he: "צידון", lat: 33.5625, lng: 35.3725, zoom: 13.5, certainty: "known",
    refs: ["Genesis 10", "Judges 18", "I Kings 16", "Ezekiel 28"],
    story: {
      en: "Canaan's “firstborn” and home of the Sidonians. Jezebel was the daughter of their king, and its Persian-era kings left famous sarcophagi.",
      he: "״בכור״ כנען ועיר הצידונים. איזבל הייתה בת מלכם, ומלכיה בתקופה הפרסית הותירו ארונות קבורה מפורסמים.",
    },
  },
  {
    id: "zarephath", en: "Zarephath (Sarafand)", he: "צרפת (סרפנד)", lat: 33.4575, lng: 35.2958, zoom: 13.5, certainty: "known",
    refs: ["I Kings 17", "Obadiah 1"],
    story: {
      en: "In the drought Elijah lodged with a widow here: her jar of flour never ran out and her jug of oil never failed.",
      he: "בימי הבצורת התגורר כאן אליהו אצל אלמנה: ״כד הקמח לא כלתה וצפחת השמן לא חסר״.",
    },
  },
  {
    id: "damascus", en: "Damascus", he: "דמשק", lat: 33.5117, lng: 36.3064, zoom: 12, certainty: "known",
    refs: ["Genesis 15", "I Kings 19", "II Kings 5", "II Kings 16", "Isaiah 17"],
    story: {
      en: "Capital of Aram and Israel's great rival. Naaman preferred its rivers to the Jordan, and King Ahaz copied an altar he saw here.",
      he: "בירת ארם ויריבתה הגדולה של ישראל. נעמן העדיף את נהרותיה על הירדן, והמלך אחז העתיק מזבח שראה בה.",
    },
  },
  {
    id: "riblah", en: "Riblah", he: "רבלה", lat: 34.4321, lng: 36.5491, zoom: 13, certainty: "known",
    refs: ["II Kings 23", "II Kings 25", "Jeremiah 39", "Jeremiah 52"],
    story: {
      en: "Conquerors' camp on the Orontes. Here Pharaoh Necho chained Jehoahaz, and Nebuchadnezzar passed judgment on Zedekiah, Judah's last king.",
      he: "מחנה הכובשים על האורונטס. כאן אסר פרעה נכה את יהואחז, ונבוכדנאצר דן את צדקיהו, מלכה האחרון של יהודה.",
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
  {
    id: "redsea", en: "The Sea of Reeds", he: "ים סוף", lat: 30.3225, lng: 32.3825, zoom: 9, certainty: "debated",
    refs: ["Exodus 14", "Exodus 15", "Numbers 33", "Psalms 136"],
    story: {
      en: "A strong east wind blows all night, the sea splits, and Israel crosses on dry ground. On the far shore Miriam takes up her drum.",
      he: "רוח קדים עזה נושבת כל הלילה, הים נבקע ובני ישראל עוברים ביבשה. על החוף שמנגד לוקחת מרים את התוף בידה.",
    },
  },
  {
    id: "raamses", en: "Raamses and Pithom", he: "רעמסס ופיתום", lat: 30.7989, lng: 31.8358, zoom: 13, certainty: "known",
    refs: ["Genesis 47", "Exodus 1", "Exodus 12", "Numbers 33"],
    story: {
      en: "The store cities Israel built for Pharaoh, and the first stage of the Exodus: “They set out from Rameses to Succoth.”",
      he: "ערי המסכנות שבני ישראל בנו לפרעה, ונקודת היציאה ממצרים: ״ויסעו בני ישראל מרעמסס סכתה״.",
    },
  },
  {
    id: "memphis", en: "Memphis (Noph)", he: "נוף (ממפיס)", lat: 29.8494, lng: 31.255, zoom: 13.5, certainty: "known",
    refs: ["Isaiah 19", "Jeremiah 44", "Jeremiah 46", "Ezekiel 30", "Hosea 9"],
    story: {
      en: "Egypt's ancient capital, Noph to the prophets. In Jeremiah's day refugees from Judah lived here.",
      he: "בירתה העתיקה של מצרים, ״נֹף״ בפי הנביאים. בימי ירמיהו ישבו בה פליטים מיהודה.",
    },
  },
  {
    id: "on", en: "On (Heliopolis)", he: "און (הליופוליס)", lat: 30.1293, lng: 31.3075, zoom: 14, certainty: "known",
    refs: ["Genesis 41", "Genesis 46", "Jeremiah 43", "Ezekiel 30"],
    story: {
      en: "The city of the sun. Joseph marries Asenath, daughter of Potiphera, priest of On; one of its obelisks still stands.",
      he: "עיר השמש. יוסף נושא את אסנת בת פוטי פרע כהן און; אחד האובליסקים שלה עדיין עומד במקומו.",
    },
  },
  {
    id: "nile", en: "The Nile", he: "היאור (הנילוס)", lat: 27.2029, lng: 31.1902, zoom: 7, certainty: "known",
    refs: ["Genesis 41", "Exodus 2", "Exodus 7", "Ezekiel 29"],
    story: {
      en: "Pharaoh dreams on its bank, a baby floats in a basket among its reeds, and its water turns to blood.",
      he: "פרעה חולם על שפתו, תינוק צף בתיבה בין קני הסוף שלו, ומימיו הופכים לדם.",
    },
  },
  {
    id: "bozrah", en: "Bozrah (Busayra)", he: "בצרה (בוצירה)", lat: 30.7389, lng: 35.6072, zoom: 14, certainty: "known",
    refs: ["Genesis 36", "Isaiah 34", "Isaiah 63", "Jeremiah 49", "Amos 1"],
    story: {
      en: "Edom's chief city. Isaiah sees one coming from Edom in crimson-stained garments from Bozrah.",
      he: "העיר הראשית של אדום. ״מי זה בא מאדום חמוץ בגדים מבצרה״.",
    },
  },
  {
    id: "mounthor", en: "Mount Hor (Jabal Harun)", he: "הור ההר (ג׳בל הארון)", lat: 30.317, lng: 35.4064, zoom: 13, certainty: "traditional",
    refs: ["Numbers 20", "Numbers 21", "Numbers 33", "Deuteronomy 32"],
    story: {
      en: "Moses dresses Eleazar in his father's robes, and Aaron dies on the mountaintop. All Israel mourns him thirty days.",
      he: "משה מלביש את אלעזר בבגדי אביו, ואהרן מת בראש ההר. כל ישראל בוכים עליו שלושים יום.",
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
  {
    id: "carchemish", en: "Carchemish", he: "כרכמיש", lat: 36.8295, lng: 38.0165, zoom: 13.5, certainty: "known",
    refs: ["Isaiah 10", "Jeremiah 46", "II Chronicles 35"],
    story: {
      en: "The great fortress on the Euphrates where Nebuchadnezzar crushed Pharaoh Necho in 605 BCE, ending Egypt's hold on the Levant.",
      he: "המבצר הגדול על הפרת, שבו ריסק נבוכדנאצר את צבא פרעה נכה ב־605 לפנה״ס ושם קץ לשליטת מצרים בלבנט.",
    },
  },
  {
    id: "euphrates", en: "The Euphrates", he: "נהר פרת", lat: 34.5494, lng: 40.89, zoom: 9, certainty: "known",
    refs: ["Genesis 2", "Genesis 15", "Jeremiah 13", "Jeremiah 46", "Jeremiah 51"],
    story: {
      en: "“The great river,” the far border of the promise. Babylon beat Egypt on its bank at Carchemish, and Jeremiah's scroll sank in its water.",
      he: "״הנהר הגדול״, גבולה הרחוק של ההבטחה. על גדתו, בכרכמיש, הביסה בבל את מצרים, ובמימיו טבע ספר נבואותיו של ירמיהו.",
    },
  },
  {
    id: "tigris", en: "The Tigris (Hiddekel)", he: "החידקל (טיגריס)", lat: 35.4567, lng: 43.2625, zoom: 9, certainty: "known",
    refs: ["Genesis 2", "Genesis 10", "Daniel 10"],
    story: {
      en: "A river of Eden. Daniel stands on its bank and sees “a man clothed in linen”; on its banks rose Ashur, Assyria's first capital.",
      he: "מנהרות עדן. דניאל עומד על גדתו ורואה ״איש לבוש בדים״; על גדותיו קמה אשור, הבירה הראשונה של האשורים.",
    },
  },
  {
    id: "ecbatana", en: "Ecbatana (Achmetha)", he: "אחמתא (המדאן)", lat: 34.8064, lng: 48.5161, zoom: 13, certainty: "known",
    refs: ["II Kings 17", "Ezra 5", "Ezra 6"],
    story: {
      en: "The summer capital of Persia's kings. Here Darius's officials found the scroll in which Cyrus allowed the Temple to be rebuilt.",
      he: "בירת הקיץ של מלכי פרס. כאן מצאו פקידי דריווש את המגילה שבה התיר כורש לבנות מחדש את המקדש.",
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
