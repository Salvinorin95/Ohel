// Quiz questions for "study together" rounds. The first option is always the right one;
// the server shuffles them before sending.

export interface Question {
  id: string;
  book: string;
  ref: string;
  en: { q: string; options: [string, string, string, string]; explain: string };
  he: { q: string; options: [string, string, string, string]; explain: string };
}

export const QUESTIONS: Question[] = [
  // ── Saul and Gilboa ──
  {
    id: "saul-death", book: "I Samuel", ref: "I Samuel 31:4",
    en: { q: "How did Saul die on Mount Gilboa?", options: ["He fell on his own sword", "Goliath's brother killed him", "He drowned in the Jordan", "He died of old age in Gibeah"], explain: "Badly wounded by archers, Saul asked his armor-bearer to kill him. He refused, so Saul fell on his sword (1 Sam 31:4). In 2 Samuel 1 an Amalekite tells David a different story." },
    he: { q: "איך מת שאול בהר הגלבוע?", options: ["נפל על חרבו", "אחיו של גלית הרג אותו", "טבע בירדן", "מת מזקנה בגבעה"], explain: "שאול נפצע מהמורים, ביקש מנושא כליו להמיתו, וכשזה סירב נפל על חרבו (שמואל א ל״א, ד). בשמואל ב א׳ נער עמלקי מספר לדוד סיפור אחר." },
  },
  {
    id: "saul-sons", book: "I Samuel", ref: "I Samuel 31:2",
    en: { q: "Which of Saul's sons fell with him on Gilboa?", options: ["Jonathan, Abinadab and Malchi-shua", "Jonathan and Ish-bosheth", "Absalom and Amnon", "Only Jonathan"], explain: "1 Samuel 31:2 names all three. Ish-bosheth survived and reigned briefly afterwards." },
    he: { q: "אילו מבני שאול נפלו איתו בגלבוע?", options: ["יהונתן, אבינדב ומלכישוע", "יהונתן ואיש בושת", "אבשלום ואמנון", "רק יהונתן"], explain: "שמואל א ל״א, ב מונה את שלושתם. איש בושת שרד ומלך זמן קצר אחר כך." },
  },
  {
    id: "jabesh", book: "I Samuel", ref: "I Samuel 31:11",
    en: { q: "Who took Saul's body down from the wall of Beth-shean?", options: ["The men of Jabesh-gilead", "David's soldiers", "The priests of Nob", "Jonathan's son"], explain: "Saul had once saved Jabesh-gilead (1 Sam 11). Its men walked all night to bring him home." },
    he: { q: "מי הוריד את גופת שאול מחומת בית שאן?", options: ["אנשי יבש גלעד", "חיילי דוד", "כוהני נוב", "בנו של יהונתן"], explain: "שאול הציל פעם את יבש גלעד (שמואל א י״א). אנשיה הלכו כל הלילה כדי להביא אותו הביתה." },
  },
  {
    id: "endor", book: "I Samuel", ref: "I Samuel 28:11",
    en: { q: "Whom did Saul ask the woman of Endor to bring up?", options: ["Samuel", "Moses", "Eli", "Abraham"], explain: "“Bring up Samuel for me” (1 Sam 28:11), on the night before the battle." },
    he: { q: "את מי ביקש שאול מבעלת האוב בעין דור להעלות?", options: ["את שמואל", "את משה", "את עלי", "את אברהם"], explain: "״את שמואל העלי לי״ (שמואל א כ״ח, יא), בלילה שלפני הקרב." },
  },
  {
    id: "lament-dew", book: "II Samuel", ref: "II Samuel 1:21",
    en: { q: "In his lament, what did David wish on the mountains of Gilboa?", options: ["No dew and no rain", "Fire from heaven", "Deep snow", "A great flood"], explain: "“Mountains of Gilboa, let there be no dew or rain upon you” (2 Sam 1:21)." },
    he: { q: "מה איחל דוד להרי הגלבוע בקינה שלו?", options: ["שלא יהיו עליהם טל ומטר", "אש מן השמיים", "שלג כבד", "מבול גדול"], explain: "״הרי בגלבע אל טל ואל מטר עליכם״ (שמואל ב א׳, כא)." },
  },
  {
    id: "lament-love", book: "II Samuel", ref: "II Samuel 1:26",
    en: { q: "David said Jonathan's love for him was more wonderful than…", options: ["the love of women", "gold and silver", "the morning star", "wine"], explain: "“Your love was wonderful to me, more than the love of women” (2 Sam 1:26)." },
    he: { q: "דוד אמר שאהבת יהונתן אליו הייתה נפלאה יותר מ…", options: ["אהבת נשים", "כסף וזהב", "כוכב השחר", "יין"], explain: "״נפלאתה אהבתך לי מאהבת נשים״ (שמואל ב א׳, כו)." },
  },
  {
    id: "donkeys", book: "I Samuel", ref: "I Samuel 9:3",
    en: { q: "What was Saul looking for when he first met Samuel?", options: ["His father's lost donkeys", "A wife", "A new sword", "A spring of water"], explain: "Kish's donkeys were lost. Saul went looking for donkeys and found a kingdom (1 Sam 9)." },
    he: { q: "מה חיפש שאול כשפגש לראשונה את שמואל?", options: ["את האתונות של אביו", "אישה", "חרב חדשה", "מעיין מים"], explain: "אתונות קיש אבדו. שאול יצא לחפש אתונות ומצא מלוכה (שמואל א ט׳)." },
  },
  {
    id: "baggage", book: "I Samuel", ref: "I Samuel 10:22",
    en: { q: "Where was Saul when he was chosen king at Mizpah?", options: ["Hiding among the baggage", "In a cave", "Under a palm tree", "Out in the fields"], explain: "“He is hiding among the baggage” (1 Sam 10:22)." },
    he: { q: "איפה היה שאול כשנבחר למלך במצפה?", options: ["נחבא אל הכלים", "במערה", "תחת עץ תמר", "בשדה"], explain: "״הנה הוא נחבא אל הכלים״ (שמואל א י׳, כב)." },
  },
  // ── David ──
  {
    id: "stones", book: "I Samuel", ref: "I Samuel 17:40",
    en: { q: "How many smooth stones did David take from the brook?", options: ["Five", "Three", "Seven", "One"], explain: "“He chose five smooth stones from the brook” (1 Sam 17:40)." },
    he: { q: "כמה חלוקי אבנים לקח דוד מן הנחל?", options: ["חמישה", "שלושה", "שבעה", "אחד"], explain: "״ויבחר לו חמשה חלקי אבנים מן הנחל״ (שמואל א י״ז, מ)." },
  },
  {
    id: "elah", book: "I Samuel", ref: "I Samuel 17:2",
    en: { q: "Where did David face Goliath?", options: ["The Valley of Elah", "The Jezreel Valley", "The Kidron Valley", "The Valley of Aijalon"], explain: "Israel camped in the Valley of Elah, the Philistines on the opposite hill (1 Sam 17:2-3)." },
    he: { q: "איפה עמד דוד מול גלית?", options: ["בעמק האלה", "בעמק יזרעאל", "בנחל קדרון", "בעמק איילון"], explain: "ישראל חנו בעמק האלה והפלשתים על ההר שממול (שמואל א י״ז, ב-ג)." },
  },
  {
    id: "goliath-city", book: "I Samuel", ref: "I Samuel 17:4",
    en: { q: "Which city did Goliath come from?", options: ["Gath", "Gaza", "Ashdod", "Ekron"], explain: "“Goliath of Gath” (1 Sam 17:4)." },
    he: { q: "מאיזו עיר בא גלית?", options: ["גת", "עזה", "אשדוד", "עקרון"], explain: "״גלית שמו מגת״ (שמואל א י״ז, ד)." },
  },
  {
    id: "anointing", book: "I Samuel", ref: "I Samuel 16:11",
    en: { q: "Where was David when Samuel came to anoint one of Jesse's sons?", options: ["Out tending the sheep", "At war", "In Jerusalem", "Asleep in the tent"], explain: "“There is still the youngest, and he is tending the sheep” (1 Sam 16:11)." },
    he: { q: "איפה היה דוד כששמואל בא למשוח את אחד מבני ישי?", options: ["רעה את הצאן", "במלחמה", "בירושלים", "ישן באוהל"], explain: "״עוד שאר הקטן והנה רעה בצאן״ (שמואל א ט״ז, יא)." },
  },
  {
    id: "lyre", book: "I Samuel", ref: "I Samuel 16:23",
    en: { q: "How did David first come into Saul's service?", options: ["Playing the lyre to calm him", "As a cook", "As a messenger", "As a prisoner"], explain: "When the dark spirit came on Saul, David played and Saul was relieved (1 Sam 16:23)." },
    he: { q: "איך הגיע דוד לראשונה לשרת את שאול?", options: ["ניגן בכינור כדי להרגיע אותו", "כטבח", "כשליח", "כשבוי"], explain: "כשהרוח הרעה באה על שאול, דוד ניגן ורווח לשאול (שמואל א ט״ז, כג)." },
  },
  {
    id: "thousands", book: "I Samuel", ref: "I Samuel 18:7",
    en: { q: "“Saul has slain his thousands, and David…”", options: ["his tens of thousands", "his hundreds", "his lions", "his giants"], explain: "The women's song that made Saul jealous (1 Sam 18:7)." },
    he: { q: "״הכה שאול באלפיו, ודוד…״", options: ["ברבבותיו", "במאותיו", "באריותיו", "בענקיו"], explain: "השיר של הנשים שעורר את קנאת שאול (שמואל א י״ח, ז)." },
  },
  {
    id: "robe", book: "I Samuel", ref: "I Samuel 24:5",
    en: { q: "In the cave at Ein Gedi, what did David cut from Saul?", options: ["The corner of his robe", "A lock of his hair", "His spear strap", "His crown"], explain: "David cut the corner of Saul's robe quietly, and even that troubled his heart (1 Sam 24:5-6)." },
    he: { q: "במערה בעין גדי, מה כרת דוד משאול?", options: ["את כנף המעיל", "קווצת שיער", "את רצועת החנית", "את הכתר"], explain: "דוד כרת בלאט את כנף המעיל, ואפילו על זה ״ויך לב דוד אתו״ (שמואל א כ״ד, ה-ו)." },
  },
  {
    id: "spear-jug", book: "I Samuel", ref: "I Samuel 26:12",
    en: { q: "The second time David spared Saul, what did he take from beside the sleeping king?", options: ["His spear and water jug", "His crown", "His sandals", "His signet ring"], explain: "“David took the spear and the jug of water from Saul's head” (1 Sam 26:12)." },
    he: { q: "בפעם השנייה שדוד חס על שאול, מה לקח ממראשותיו של המלך הישן?", options: ["את החנית ואת צפחת המים", "את הכתר", "את הסנדלים", "את טבעת החותם"], explain: "״ויקח דוד את החנית ואת צפחת המים מראשתי שאול״ (שמואל א כ״ו, יב)." },
  },
  {
    id: "abigail", book: "I Samuel", ref: "I Samuel 25:18",
    en: { q: "Who rode out with bread and wine and stopped David's revenge on Nabal?", options: ["Abigail", "Michal", "Bathsheba", "Ruth"], explain: "Abigail's wise words turned David back (1 Sam 25)." },
    he: { q: "מי רכבה לקראת דוד עם לחם ויין ועצרה את נקמתו בנבל?", options: ["אביגיל", "מיכל", "בת שבע", "רות"], explain: "דבריה החכמים של אביגיל השיבו את דוד מדרכו (שמואל א כ״ה)." },
  },
  {
    id: "capital", book: "II Samuel", ref: "II Samuel 5:7",
    en: { q: "Which city did David capture and make his capital?", options: ["Jerusalem", "Hebron", "Shechem", "Bethlehem"], explain: "He took the stronghold of Zion from the Jebusites and called it the City of David (2 Sam 5:7)." },
    he: { q: "איזו עיר כבש דוד והפך לבירתו?", options: ["ירושלים", "חברון", "שכם", "בית לחם"], explain: "דוד לכד את מצודת ציון מידי היבוסי וקרא לה עיר דוד (שמואל ב ה׳, ז)." },
  },
  {
    id: "hebron-years", book: "II Samuel", ref: "II Samuel 5:5",
    en: { q: "How long did David reign in Hebron?", options: ["Seven years and six months", "Forty years", "Three years", "Twelve years"], explain: "Seven and a half years in Hebron, then thirty-three in Jerusalem (2 Sam 5:5)." },
    he: { q: "כמה זמן מלך דוד בחברון?", options: ["שבע שנים ושישה חודשים", "ארבעים שנה", "שלוש שנים", "שתים עשרה שנה"], explain: "שבע שנים וחצי בחברון ושלושים ושלוש בירושלים (שמואל ב ה׳, ה)." },
  },
  {
    id: "dance", book: "II Samuel", ref: "II Samuel 6:14",
    en: { q: "What did David do as the Ark came into Jerusalem?", options: ["Danced with all his might", "Fasted in his palace", "Hid from the crowd", "Led a battle"], explain: "“David danced before the LORD with all his might” (2 Sam 6:14). Michal watched from a window." },
    he: { q: "מה עשה דוד כשהארון הגיע לירושלים?", options: ["כרכר בכל עוז", "צם בארמונו", "התחבא מההמון", "יצא לקרב"], explain: "״ודוד מכרכר בכל עז לפני ה׳״ (שמואל ב ו׳, יד). מיכל השקיפה מן החלון." },
  },
  {
    id: "lamb", book: "II Samuel", ref: "II Samuel 12:1",
    en: { q: "Which prophet told David the story of the poor man's lamb?", options: ["Nathan", "Gad", "Samuel", "Elijah"], explain: "Nathan's parable ended with: “You are the man” (2 Sam 12:7)." },
    he: { q: "איזה נביא סיפר לדוד את משל כבשת הרש?", options: ["נתן", "גד", "שמואל", "אליהו"], explain: "המשל של נתן הסתיים במילים ״אתה האיש״ (שמואל ב י״ב, ז)." },
  },
  {
    id: "absalom-tree", book: "II Samuel", ref: "II Samuel 18:9",
    en: { q: "How was Absalom caught in the forest?", options: ["His head caught in an oak", "He fell into a pit", "A lion stopped him", "He was trapped in a cave"], explain: "His mule ran under a great oak and his head caught fast (2 Sam 18:9)." },
    he: { q: "איך נלכד אבשלום ביער?", options: ["ראשו נתפס באלה", "נפל לבור", "אריה עצר אותו", "נלכד במערה"], explain: "הפרד עבר תחת שובך האלה הגדולה וראשו נאחז בה (שמואל ב י״ח, ט)." },
  },
  {
    id: "absalom-cry", book: "II Samuel", ref: "II Samuel 19:1",
    en: { q: "What did David cry when he heard Absalom was dead?", options: ["“My son Absalom! If only I had died instead of you”", "“Justice is done”", "“Bring me my sword”", "“Let the city celebrate”"], explain: "One of the most painful cries in the Bible (2 Sam 19:1 in Hebrew numbering, 18:33 in some translations)." },
    he: { q: "מה צעק דוד כששמע שאבשלום מת?", options: ["״בני אבשלום… מי יתן מותי אני תחתיך״", "״נעשה צדק״", "״הביאו לי את חרבי״", "״תחגוג העיר״"], explain: "אחת הזעקות הכואבות בתנ״ך (שמואל ב י״ט, א)." },
  },
  // ── Samuel, Kings and prophets ──
  {
    id: "hannah", book: "I Samuel", ref: "I Samuel 1:9",
    en: { q: "Where did Hannah pray for a son?", options: ["Shiloh", "Jerusalem", "Bethel", "Gilgal"], explain: "At the sanctuary in Shiloh, where Eli thought she was drunk (1 Sam 1)." },
    he: { q: "איפה התפללה חנה לבן?", options: ["בשילה", "בירושלים", "בבית אל", "בגלגל"], explain: "במשכן שילה, שם עלי חשב שהיא שיכורה (שמואל א א׳)." },
  },
  {
    id: "samuel-call", book: "I Samuel", ref: "I Samuel 3:8",
    en: { q: "How many times was Samuel called before Eli understood who was calling?", options: ["Three", "Once", "Seven", "Twice"], explain: "“The LORD called Samuel a third time… then Eli understood” (1 Sam 3:8)." },
    he: { q: "כמה פעמים נקרא שמואל עד שעלי הבין מי קורא לו?", options: ["שלוש", "פעם אחת", "שבע", "פעמיים"], explain: "״ויסף ה׳ קרא שמואל בשלשית… ויבן עלי״ (שמואל א ג׳, ח)." },
  },
  {
    id: "carmel-water", book: "I Kings", ref: "I Kings 18:34",
    en: { q: "On Mount Carmel, how many times did Elijah have water poured over the altar?", options: ["Three times", "Once", "Seven times", "Not at all"], explain: "Four jars, three times, until the trench was full (1 Kings 18:33-35)." },
    he: { q: "בהר הכרמל, כמה פעמים ציווה אליהו לשפוך מים על המזבח?", options: ["שלוש פעמים", "פעם אחת", "שבע פעמים", "אף לא פעם"], explain: "ארבעה כדים, שלוש פעמים, עד שגם התעלה התמלאה (מלכים א י״ח, לג-לה)." },
  },
  {
    id: "carmel-cloud", book: "I Kings", ref: "I Kings 18:44",
    en: { q: "What did Elijah's servant see from Carmel on the seventh look?", options: ["A small cloud like a man's hand", "A rainbow", "An eagle", "A pillar of fire"], explain: "“A cloud as small as a man's hand is rising from the sea” (1 Kings 18:44)." },
    he: { q: "מה ראה נערו של אליהו מהכרמל בפעם השביעית?", options: ["עב קטנה ככף איש", "קשת בענן", "נשר", "עמוד אש"], explain: "״הנה עב קטנה ככף איש עלה מים״ (מלכים א י״ח, מד)." },
  },
  {
    id: "still-voice", book: "I Kings", ref: "I Kings 19:12",
    en: { q: "At Horeb, after the wind, the earthquake and the fire, Elijah heard…", options: ["A still small voice", "A trumpet", "Thunder", "A choir of angels"], explain: "“After the fire, a still small voice” (1 Kings 19:12)." },
    he: { q: "בחורב, אחרי הרוח, הרעש והאש, אליהו שמע…", options: ["קול דממה דקה", "קול שופר", "רעם", "מקהלת מלאכים"], explain: "״ואחר האש קול דממה דקה״ (מלכים א י״ט, יב)." },
  },
  {
    id: "solomon-ask", book: "I Kings", ref: "I Kings 3:9",
    en: { q: "What did Solomon ask for in his dream at Gibeon?", options: ["An understanding heart", "Great riches", "A long life", "Victory over his enemies"], explain: "“Give your servant an understanding heart to judge your people” (1 Kings 3:9)." },
    he: { q: "מה ביקש שלמה בחלומו בגבעון?", options: ["לב שומע", "עושר רב", "אריכות ימים", "ניצחון על אויביו"], explain: "״ונתת לעבדך לב שמע לשפט את עמך״ (מלכים א ג׳, ט)." },
  },
  {
    id: "naboth", book: "I Kings", ref: "I Kings 21:2",
    en: { q: "What did King Ahab want from Naboth?", options: ["His vineyard", "His daughter", "His sword", "His horses"], explain: "Naboth refused to sell his family's vineyard in Jezreel (1 Kings 21)." },
    he: { q: "מה רצה המלך אחאב מנבות?", options: ["את הכרם שלו", "את בתו", "את חרבו", "את סוסיו"], explain: "נבות סירב למכור את נחלת אבותיו ביזרעאל (מלכים א כ״א)." },
  },
  {
    id: "whirlwind", book: "II Kings", ref: "II Kings 2:11",
    en: { q: "How did Elijah leave the world?", options: ["In a whirlwind, with a chariot of fire", "He died in Jericho", "He walked into the sea", "He vanished in a cave"], explain: "“Elijah went up by a whirlwind into heaven” (2 Kings 2:11), and Elisha took up his cloak." },
    he: { q: "איך עזב אליהו את העולם?", options: ["בסערה, עם רכב אש", "מת ביריחו", "נכנס לים", "נעלם במערה"], explain: "״ויעל אליהו בסערה השמים״ (מלכים ב ב׳, יא), ואלישע הרים את אדרתו." },
  },
  // ── Judges and Joshua ──
  {
    id: "gideon-300", book: "Judges", ref: "Judges 7:7",
    en: { q: "How many men did Gideon keep after the test at the spring?", options: ["300", "10,000", "32,000", "3,000"], explain: "Those who lapped water from their hands, three hundred men (Judges 7:6-7)." },
    he: { q: "כמה לוחמים השאיר גדעון אחרי המבחן במעיין?", options: ["300", "10,000", "32,000", "3,000"], explain: "המלקקים בידם אל פיהם, שלוש מאות איש (שופטים ז׳, ו-ז)." },
  },
  {
    id: "deborah", book: "Judges", ref: "Judges 4:4",
    en: { q: "Who was the prophet who judged Israel under a palm tree?", options: ["Deborah", "Miriam", "Huldah", "Jael"], explain: "“She sat under the palm of Deborah” (Judges 4:5)." },
    he: { q: "מי הייתה הנביאה ששפטה את ישראל תחת עץ תמר?", options: ["דבורה", "מרים", "חולדה", "יעל"], explain: "״והיא יושבת תחת תמר דבורה״ (שופטים ד׳, ה)." },
  },
  {
    id: "samson", book: "Judges", ref: "Judges 16:17",
    en: { q: "What was the secret of Samson's strength?", options: ["His uncut hair", "A magic ring", "A lion's heart", "His mother's necklace"], explain: "“No razor has ever come upon my head” (Judges 16:17)." },
    he: { q: "מה היה סוד הכוח של שמשון?", options: ["השיער שלא גולח", "טבעת קסם", "לב של אריה", "השרשרת של אמו"], explain: "״מורה לא עלה על ראשי״ (שופטים ט״ז, יז)." },
  },
  {
    id: "jericho", book: "Joshua", ref: "Joshua 6:15",
    en: { q: "How many times did Israel circle Jericho on the seventh day?", options: ["Seven", "Once", "Three", "Twelve"], explain: "Once a day for six days, then seven times on the seventh (Joshua 6)." },
    he: { q: "כמה פעמים הקיפו ישראל את יריחו ביום השביעי?", options: ["שבע", "פעם אחת", "שלוש", "שתים עשרה"], explain: "פעם ביום במשך שישה ימים, ושבע פעמים ביום השביעי (יהושע ו׳)." },
  },
  {
    id: "rahab", book: "Joshua", ref: "Joshua 2:18",
    en: { q: "What did Rahab tie in her window?", options: ["A scarlet cord", "A white cloth", "A lamp", "A palm branch"], explain: "“Tie this cord of scarlet thread in the window” (Joshua 2:18)." },
    he: { q: "מה קשרה רחב בחלון?", options: ["חוט השני", "בד לבן", "מנורה", "כף תמר"], explain: "״את תקות חוט השני הזה תקשרי בחלון״ (יהושע ב׳, יח)." },
  },
  // ── Torah ──
  {
    id: "day-one", book: "Genesis", ref: "Genesis 1:3",
    en: { q: "What was created on the first day?", options: ["Light", "The sun", "The sea", "Plants"], explain: "“Let there be light” (Genesis 1:3). The sun comes only on day four." },
    he: { q: "מה נברא ביום הראשון?", options: ["האור", "השמש", "הים", "הצמחים"], explain: "״יהי אור״ (בראשית א׳, ג). השמש נבראת רק ביום הרביעי." },
  },
  {
    id: "day-six", book: "Genesis", ref: "Genesis 1:27",
    en: { q: "On which day were human beings created?", options: ["The sixth", "The first", "The fourth", "The seventh"], explain: "Genesis 1:27-31. On the seventh day there is rest." },
    he: { q: "באיזה יום נברא האדם?", options: ["השישי", "הראשון", "הרביעי", "השביעי"], explain: "בראשית א׳, כז-לא. ביום השביעי - מנוחה." },
  },
  {
    id: "raven", book: "Genesis", ref: "Genesis 8:7",
    en: { q: "Which bird did Noah send out of the ark first?", options: ["A raven", "A dove", "An eagle", "A sparrow"], explain: "First the raven, then the dove three times (Genesis 8:7-12)." },
    he: { q: "איזו ציפור שלח נח ראשונה מהתיבה?", options: ["עורב", "יונה", "נשר", "דרור"], explain: "קודם העורב, ואחריו היונה שלוש פעמים (בראשית ח׳, ז-יב)." },
  },
  {
    id: "ram", book: "Genesis", ref: "Genesis 22:13",
    en: { q: "What did Abraham find caught in a thicket on Mount Moriah?", options: ["A ram", "A lamb", "A goat", "A deer"], explain: "“A ram caught in the thicket by its horns” (Genesis 22:13)." },
    he: { q: "מה מצא אברהם נאחז בסבך בהר המוריה?", options: ["איל", "כבש", "עז", "צבי"], explain: "״איל אחר נאחז בסבך בקרניו״ (בראשית כ״ב, יג)." },
  },
  {
    id: "ladder", book: "Genesis", ref: "Genesis 28:12",
    en: { q: "What did Jacob see in his dream at Bethel?", options: ["A ladder with angels", "A burning bush", "Seven cows", "A great flood"], explain: "Angels going up and down a ladder that reached the sky (Genesis 28:12)." },
    he: { q: "מה ראה יעקב בחלומו בבית אל?", options: ["סולם ומלאכים עליו", "סנה בוער", "שבע פרות", "מבול גדול"], explain: "מלאכים עולים ויורדים בסולם המגיע השמיימה (בראשית כ״ח, יב)." },
  },
  {
    id: "israel-name", book: "Genesis", ref: "Genesis 32:29",
    en: { q: "After wrestling at the Jabbok, Jacob was given which name?", options: ["Israel", "Abraham", "Judah", "Joseph"], explain: "“You have striven with God and with men, and have prevailed” (Genesis 32:29)." },
    he: { q: "אחרי המאבק במעבר יבוק, איזה שם קיבל יעקב?", options: ["ישראל", "אברהם", "יהודה", "יוסף"], explain: "״כי שרית עם אלהים ועם אנשים ותוכל״ (בראשית ל״ב, כט)." },
  },
  {
    id: "bush", book: "Exodus", ref: "Exodus 3:2",
    en: { q: "From what did God first speak to Moses?", options: ["A bush that burned and was not consumed", "A pillar of cloud", "A whirlwind", "A mountain cave"], explain: "“The bush was burning, yet it was not consumed” (Exodus 3:2)." },
    he: { q: "מתוך מה דיבר אלוהים לראשונה אל משה?", options: ["סנה בוער שאיננו אֻכָּל", "עמוד ענן", "סערה", "מערה בהר"], explain: "״והנה הסנה בער באש והסנה איננו אכל״ (שמות ג׳, ב)." },
  },
  {
    id: "sea", book: "Exodus", ref: "Exodus 14:22",
    en: { q: "What did Israel cross on dry ground after leaving Egypt?", options: ["The sea (Yam Suf)", "The Jordan", "The Nile", "The Euphrates"], explain: "“The children of Israel went into the midst of the sea on dry ground” (Exodus 14:22)." },
    he: { q: "מה חצו בני ישראל ביבשה אחרי היציאה ממצרים?", options: ["את ים סוף", "את הירדן", "את הנילוס", "את הפרת"], explain: "״ויבאו בני ישראל בתוך הים ביבשה״ (שמות י״ד, כב)." },
  },
  {
    id: "donkey", book: "Numbers", ref: "Numbers 22:23",
    en: { q: "Who saw the angel on the road first?", options: ["Balaam's donkey", "Balaam", "Balak", "Balak's officers"], explain: "The donkey saw the angel three times before Balaam's eyes were opened (Numbers 22)." },
    he: { q: "מי ראה ראשון את המלאך בדרך?", options: ["האתון של בלעם", "בלעם", "בלק", "שרי בלק"], explain: "האתון ראתה את המלאך שלוש פעמים לפני שנפקחו עיני בלעם (במדבר כ״ב)." },
  },
  {
    id: "nebo", book: "Deuteronomy", ref: "Deuteronomy 34:1",
    en: { q: "From which mountain did Moses see the land before he died?", options: ["Mount Nebo", "Mount Sinai", "Mount Carmel", "Mount Tabor"], explain: "“Moses went up… to Mount Nebo, and the LORD showed him all the land” (Deut 34:1)." },
    he: { q: "מאיזה הר ראה משה את הארץ לפני מותו?", options: ["הר נבו", "הר סיני", "הר הכרמל", "הר תבור"], explain: "״ויעל משה… אל הר נבו ויראהו ה׳ את כל הארץ״ (דברים ל״ד, א)." },
  },
  // ── Writings and the twelve ──
  {
    id: "tarshish", book: "Jonah", ref: "Jonah 1:3",
    en: { q: "Where was Jonah running to?", options: ["Tarshish", "Nineveh", "Egypt", "Babylon"], explain: "He went down to Jaffa and found a ship going to Tarshish (Jonah 1:3)." },
    he: { q: "לאן ברח יונה?", options: ["לתרשיש", "לנינוה", "למצרים", "לבבל"], explain: "הוא ירד ליפו ומצא אנייה באה תרשיש (יונה א׳, ג)." },
  },
  {
    id: "fish", book: "Jonah", ref: "Jonah 2:1",
    en: { q: "How long was Jonah inside the fish?", options: ["Three days and three nights", "Seven days", "Forty days", "One night"], explain: "Jonah 2:1 (1:17 in some translations)." },
    he: { q: "כמה זמן היה יונה במעי הדג?", options: ["שלושה ימים ושלושה לילות", "שבעה ימים", "ארבעים יום", "לילה אחד"], explain: "יונה ב׳, א." },
  },
  {
    id: "kikayon", book: "Jonah", ref: "Jonah 4:6",
    en: { q: "What grew up overnight to shade Jonah?", options: ["A kikayon plant", "A palm tree", "A fig tree", "A grapevine"], explain: "God made a kikayon grow, and then a worm destroyed it (Jonah 4:6-7)." },
    he: { q: "מה צמח בן לילה כדי להצל על יונה?", options: ["קיקיון", "עץ תמר", "עץ תאנה", "גפן"], explain: "אלוהים הצמיח קיקיון, ואחר כך תולעת הכתה אותו (יונה ד׳, ו-ז)." },
  },
  {
    id: "ruth-go", book: "Ruth", ref: "Ruth 1:16",
    en: { q: "“Where you go, I will go.” Ruth said this to…", options: ["Naomi", "Boaz", "Orpah", "Elimelech"], explain: "“Your people shall be my people” (Ruth 1:16)." },
    he: { q: "״אל אשר תלכי אלך״. רות אמרה זאת ל…", options: ["נעמי", "בעז", "ערפה", "אלימלך"], explain: "״עמך עמי ואלהיך אלהי״ (רות א׳, טז)." },
  },
  {
    id: "ruth-field", book: "Ruth", ref: "Ruth 2:3",
    en: { q: "In whose field did Ruth glean?", options: ["Boaz", "Elimelech", "Obed", "Jesse"], explain: "“She happened to come to the part of the field belonging to Boaz” (Ruth 2:3)." },
    he: { q: "בשדה של מי ליקטה רות?", options: ["בעז", "אלימלך", "עובד", "ישי"], explain: "״ויקר מקרה חלקת השדה לבעז״ (רות ב׳, ג)." },
  },
  {
    id: "ruth-david", book: "Ruth", ref: "Ruth 4:22",
    en: { q: "Ruth's great-grandson became…", options: ["King David", "King Saul", "The prophet Samuel", "King Solomon"], explain: "Ruth → Obed → Jesse → David (Ruth 4:17-22)." },
    he: { q: "הנין של רות היה…", options: ["דוד המלך", "שאול המלך", "שמואל הנביא", "שלמה המלך"], explain: "רות ← עובד ← ישי ← דוד (רות ד׳, יז-כב)." },
  },
  {
    id: "esther", book: "Esther", ref: "Esther 4:14",
    en: { q: "Who told Esther, “Who knows whether you came to royalty for such a time as this?”", options: ["Mordecai", "Haman", "King Ahasuerus", "Hegai"], explain: "Mordecai's message moved Esther to go to the king (Esther 4:14)." },
    he: { q: "מי אמר לאסתר ״ומי יודע אם לעת כזאת הגעת למלכות״?", options: ["מרדכי", "המן", "המלך אחשוורוש", "הגי"], explain: "דבריו של מרדכי הניעו את אסתר ללכת אל המלך (אסתר ד׳, יד)." },
  },
  {
    id: "lions", book: "Daniel", ref: "Daniel 6:17",
    en: { q: "Daniel was thrown into a den of…", options: ["Lions", "Snakes", "Bears", "Wolves"], explain: "“My God sent his angel and shut the lions' mouths” (Daniel 6:23)." },
    he: { q: "דניאל הושלך לגוב של…", options: ["אריות", "נחשים", "דובים", "זאבים"], explain: "״אלהי שלח מלאכה וסגר פם אריותא״ (דניאל ו׳, כג)." },
  },
  {
    id: "shepherd", book: "Psalms", ref: "Psalms 23:1",
    en: { q: "“The LORD is my shepherd, I shall not…”", options: ["want", "fear", "fall", "sleep"], explain: "Psalm 23:1, a psalm of David." },
    he: { q: "״ה׳ רעי, לא…״", options: ["אחסר", "אירא", "אפול", "אישן"], explain: "תהלים כ״ג, א, מזמור לדוד." },
  },
  {
    id: "babylon-rivers", book: "Psalms", ref: "Psalms 137:1",
    en: { q: "“By the rivers of Babylon, there we sat and…”", options: ["wept", "sang", "slept", "prayed"], explain: "“…we wept when we remembered Zion” (Psalm 137:1)." },
    he: { q: "״על נהרות בבל, שם ישבנו גם…״", options: ["בכינו", "שרנו", "ישנו", "התפללנו"], explain: "״…בזכרנו את ציון״ (תהלים קל״ז, א)." },
  },
];

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
export const findQuestion = (id: string) => byId.get(id);

/** Pick a question, preferring the room's book and avoiding recent ones. */
export function pickQuestion(book: string | null, recent: string[]): Question {
  const fresh = QUESTIONS.filter((q) => !recent.includes(q.id));
  const pool = fresh.length ? fresh : QUESTIONS;
  const near = book ? pool.filter((q) => q.book === book) : [];
  const from = near.length && Math.random() < 0.75 ? near : pool;
  return from[Math.floor(Math.random() * from.length)];
}
