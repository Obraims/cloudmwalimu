import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Globe,
  Lightbulb,
  Send,
  Shield,
  ShieldCheck,
  Target,
  Trash2,
  XCircle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { isGeminiConfigured, askGeminiStudyBuddy } from '@/lib/geminiClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { seedQuestions } from '@/data/seedQuestions';

const languages = ['English', 'Kiswahili', 'Sheng'];

const langFlag = {
  English: 'EN',
  Kiswahili: 'SW',
  Sheng: 'SH',
};

const GREETINGS = {
  English: {
    id: 'init-1',
    role: 'ai',
    text: 'Hello! I am your AfriCloud Prep AZ-900 Study Buddy. Ask me any Azure concept and I will break it down using real-life Kenyan analogies - M-Pesa agents, matatus, SACCO locks, or county by-laws. You can chat in English, Kiswahili, or Sheng!\n\nTap any starter topic or type your question below.',
    lang: 'English',
  },
  Kiswahili: {
    id: 'init-1',
    role: 'ai',
    text: 'Jambo! Mimi ni Study Buddy wako wa AfriCloud Prep kwa mtihani wa AZ-900. Niulize dhana yoyote ya Azure nami nitaifafanua kwa mifano halisi ya Kenya - mawakala wa M-Pesa, matatu, sefu za SACCO, au sheria za kaunti. Unaweza kuongea nami kwa Kiingereza, Kiswahili, au Sheng!\n\nChagua mada yoyote au andika swali lako hapa chini.',
    lang: 'Kiswahili',
  },
  Sheng: {
    id: 'init-1',
    role: 'ai',
    text: 'Niaje! Mimi ni Study Buddy wako wa AfriCloud Prep wa AZ-900. Niulize risto yoyote ya Azure nitakuwekea na ma-analogy za mtaani - ma-agent wa M-Pesa, matatu, SACCO locks, na ma-rule za county. Unaweza bonga nami in English, Kiswahili, ama Sheng!\n\nGonga topic yoyote hapo chini ama drop swali uanze kutesa.',
    lang: 'Sheng',
  },
};

const INITIAL_GREETING = GREETINGS.English;

const STARTER_TOPICS = [
  {
    title: 'Availability Zones',
    subtitle: 'Keep your app running if a datacenter fails',
    prompt: 'Explain Azure Availability Zones using an M-Pesa agent analogy',
    icon: Globe,
  },
  {
    title: 'Shared Responsibility',
    subtitle: 'What Microsoft secures vs what you secure',
    prompt: 'How does the Shared Responsibility Model work? Use a matatu analogy',
    icon: ShieldCheck,
  },
  {
    title: 'CapEx vs OpEx',
    subtitle: 'Buy upfront or pay as you use',
    prompt: 'What is the difference between CapEx and OpEx in cloud spending?',
    icon: CreditCard,
  },
  {
    title: 'NSG vs Azure Firewall',
    subtitle: 'Two ways to control network traffic',
    prompt: 'Differentiate between Network Security Groups and Azure Firewall using county by-laws',
    icon: Shield,
  },
];

const SUGGESTED_PROMPTS = [
  {
    label: 'Availability Zones',
    prompt: 'Explain Azure Availability Zones using an M-Pesa analogy',
  },
  {
    label: 'Shared Responsibility',
    prompt: 'How does the Shared Responsibility Model work? Use a matatu analogy',
  },
  {
    label: 'CapEx vs OpEx',
    prompt: 'What is the difference between CapEx and OpEx in cloud computing?',
  },
  {
    label: 'NSG vs Azure Firewall',
    prompt: 'Differentiate between Network Security Groups and Azure Firewall',
  },
  {
    label: 'Storage Tiers',
    prompt: 'Explain Hot, Cool, and Archive Blob Storage tiers in Sheng',
  },
];

function findMatchingQuestion(text = '') {
  const t = text.toLowerCase();
  const matched = seedQuestions.find((q) => {
    const qText = `${q.question} ${q.objective || ''} ${q.topic_id || ''}`.toLowerCase();
    if (t.includes('zone') || t.includes('availability') || t.includes('redundancy')) {
      return qText.includes('zone') || qText.includes('redundancy');
    }
    if (
      t.includes('storage') ||
      t.includes('blob') ||
      t.includes('tier') ||
      t.includes('archive')
    ) {
      return qText.includes('storage') || qText.includes('blob');
    }
    if (
      t.includes('shared responsibility') ||
      t.includes('responsibility') ||
      t.includes('matatu')
    ) {
      return qText.includes('shared responsibility');
    }
    if (
      t.includes('iaas') ||
      t.includes('paas') ||
      t.includes('saas') ||
      t.includes('service model')
    ) {
      return qText.includes('iaas') || qText.includes('paas') || qText.includes('saas');
    }
    if (
      t.includes('capex') ||
      t.includes('opex') ||
      t.includes('expenditure') ||
      t.includes('cost')
    ) {
      return qText.includes('capex') || qText.includes('opex') || qText.includes('capital');
    }
    if (
      t.includes('policy') ||
      t.includes('lock') ||
      t.includes('rbac') ||
      t.includes('governance')
    ) {
      return qText.includes('policy') || qText.includes('lock') || qText.includes('role');
    }
    if (
      t.includes('firewall') ||
      t.includes('nsg') ||
      t.includes('security') ||
      t.includes('ddos')
    ) {
      return (
        qText.includes('firewall') || qText.includes('security group') || qText.includes('nsg')
      );
    }
    return false;
  });

  if (matched) return matched;
  const randomIndex = Math.floor(Math.random() * Math.min(25, seedQuestions.length));
  return seedQuestions[randomIndex];
}

export function BuddyPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [draft, setDraft] = useState('');
  const [lang, setLang] = useState(() => {
    return profile?.buddy_language || localStorage.getItem('africloud_buddy_lang') || 'English';
  });
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const langMenuRef = useRef(null);

  // Sync default language from profile if available
  useEffect(() => {
    if (profile?.buddy_language && languages.includes(profile.buddy_language)) {
      setLang(profile.buddy_language);
    }
  }, [profile?.buddy_language]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveLocalMessages = (msgs) => {
    try {
      localStorage.setItem('africloud_prep_chat_messages', JSON.stringify(msgs));
    } catch (e) {
      console.warn('Local chat save notice:', e);
    }
  };

  useEffect(() => {
    async function loadUserMessages() {
      if (!isSupabaseConfigured()) {
        try {
          const localMsgs = JSON.parse(
            localStorage.getItem('africloud_prep_chat_messages') || 'null'
          );
          if (localMsgs && Array.isArray(localMsgs) && localMsgs.length > 0) {
            setMessages(localMsgs);
            return;
          }
        } catch (e) {
          console.warn('Local chat load notice:', e);
        }
        setMessages([GREETINGS[lang] || INITIAL_GREETING]);
        return;
      }

      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          if (data && data.length > 0 && !error) {
            setMessages(
              data.map((m) => ({
                id: m.id,
                role: m.role,
                text: m.text,
                lang: m.lang || 'English',
                question: m.question || null,
                selectedOption: m.selected_option ?? null,
                revealed: m.revealed || false,
              }))
            );
            return;
          }
        } catch (e) {
          console.warn('Remote chat load notice:', e);
        }
      }
      setMessages([GREETINGS[lang] || INITIAL_GREETING]);
    }
    loadUserMessages();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const clearChat = async () => {
    const freshGreeting = GREETINGS[lang] || INITIAL_GREETING;
    setMessages([freshGreeting]);
    if (!isSupabaseConfigured()) {
      localStorage.removeItem('africloud_prep_chat_messages');
    } else if (user?.id) {
      try {
        await supabase.from('chat_messages').delete().eq('user_id', user.id);
      } catch (e) {
        console.warn('Failed to clear remote chat:', e);
      }
    }
  };

  const handleLanguageSelect = (selectedLang) => {
    setLang(selectedLang);
    setLangMenuOpen(false);
    localStorage.setItem('africloud_buddy_lang', selectedLang);

    // If chat only has initial greeting, update greeting to new language
    setMessages((prev) => {
      if (prev.length <= 1 && (prev[0]?.id === 'init-1' || prev.length === 0)) {
        return [GREETINGS[selectedLang] || GREETINGS.English];
      }
      return prev;
    });
  };

  const handleQuizMe = (aiMsg) => {
    const matchedQuestion = findMatchingQuestion(aiMsg.text);
    const quizMsg = {
      id: `quiz-${Date.now()}`,
      role: 'quiz',
      topic: matchedQuestion.topic_id || 'Azure Fundamentals',
      question: matchedQuestion,
      selectedOption: null,
      revealed: false,
      lang,
    };
    const updated = [...messages, quizMsg];
    setMessages(updated);
    if (!isSupabaseConfigured()) {
      saveLocalMessages(updated);
    }
  };

  const handleAnswerQuiz = async (msgId, q, selectedIdx) => {
    const isCorrect = selectedIdx === q.answerIndex;

    const updated = messages.map((m) => {
      if (m.id === msgId) {
        return { ...m, selectedOption: selectedIdx, revealed: true };
      }
      return m;
    });
    setMessages(updated);
    if (!isSupabaseConfigured()) {
      saveLocalMessages(updated);
    }

    const attemptRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user?.id || 'demo-user',
      question_id: q.id,
      domain_id: q.domain_id || 1,
      topic_id: q.topic_id || 'general',
      selected_index: selectedIdx,
      is_correct: isCorrect,
      mode: 'study_buddy',
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      try {
        const localAttempts = JSON.parse(localStorage.getItem('africloud_prep_attempts') || '[]');
        localAttempts.unshift(attemptRecord);
        localStorage.setItem('africloud_prep_attempts', JSON.stringify(localAttempts));
      } catch (e) {
        console.warn('Attempt local save notice:', e);
      }
    } else {
      try {
        await supabase.from('attempts').insert([attemptRecord]);
      } catch (e) {
        console.warn('Remote attempt save notice:', e);
      }
    }

    // Add missed questions to flashcard queue
    if (!isCorrect) {
      const domainLabel =
        q.domain_id === 1
          ? 'Cloud Concepts'
          : q.domain_id === 2
            ? 'Azure Architecture & Services'
            : 'Azure Management & Governance';

      const cardRecord = {
        id: `card-${Date.now()}`,
        user_id: user?.id || 'demo-user',
        question_id: q.id,
        front: q.question,
        back: `${q.options[q.answerIndex]}\n\nExplanation: ${q.explanation}`,
        domain: domainLabel,
        box: 1,
        next_review: new Date().toISOString(),
        source: 'study_buddy_miss',
      };

      if (!isSupabaseConfigured()) {
        try {
          const localCards = JSON.parse(localStorage.getItem('africloud_prep_flashcards') || '[]');
          localCards.unshift(cardRecord);
          localStorage.setItem('africloud_prep_flashcards', JSON.stringify(localCards));
        } catch (e) {
          console.warn('Flashcard local save notice:', e);
        }
      } else {
        try {
          await supabase.from('flashcards').insert([cardRecord]);
        } catch (e) {
          console.warn('Flashcard save notice:', e);
        }
      }
    }
  };

  const send = async (overrideText) => {
    const text = (overrideText || draft).trim();
    if (!text) return;
    const userMsg = { id: `u${Date.now()}`, role: 'user', text, lang };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setDraft('');
    setTyping(true);

    if (!isSupabaseConfigured()) {
      saveLocalMessages(updated);
    } else if (user?.id) {
      try {
        await supabase.from('chat_messages').insert([
          {
            user_id: user.id,
            role: 'user',
            text,
            lang,
          },
        ]);
      } catch (e) {
        console.warn('Could not persist user message:', e);
      }
    }

    // 1. Live AfriCloud AI (Gemini client execution)
    if (isGeminiConfigured()) {
      try {
        const replyText = await askGeminiStudyBuddy({
          message: text,
          language: lang,
          learnerContext: user?.id ? `Learner user ${user.id}` : '',
        });

        if (replyText) {
          const aiMsg = {
            id: `a${Date.now()}`,
            role: 'ai',
            text: replyText,
            lang,
          };
          const next = [...updated, aiMsg];
          setMessages(next);
          setTyping(false);
          if (!isSupabaseConfigured()) {
            saveLocalMessages(next);
          } else if (user?.id) {
            try {
              await supabase.from('chat_messages').insert([
                {
                  user_id: user.id,
                  role: 'ai',
                  text: replyText,
                  lang,
                },
              ]);
            } catch (e) {
              console.warn('Could not persist AI reply:', e);
            }
          }
          return;
        }
      } catch (geminiErr) {
        console.warn('Gemini client call failed, trying Edge Function fallback:', geminiErr);
      }
    }

    // 2. Supabase Edge Function fallback
    if (isSupabaseConfigured()) {
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('buddy-chat', {
          body: {
            message: text,
            language: lang,
            user_id: user?.id || null,
          },
        });

        if (!edgeError && edgeData?.reply) {
          const aiMsg = {
            id: `a${Date.now()}`,
            role: 'ai',
            text: edgeData.reply,
            lang,
          };
          const next = [...updated, aiMsg];
          setMessages(next);
          setTyping(false);
          saveLocalMessages(next);
          return;
        }
      } catch (edgeErr) {
        console.warn('Edge function invoke fallback encountered error:', edgeErr);
      }
    }

    // 3. Local Deterministic Analogy Engine fallback
    setTimeout(() => {
      const lower = text.toLowerCase().trim();
      let replyText = '';

      const isGreeting =
        lower === 'hi' ||
        lower === 'hello' ||
        lower === 'hey' ||
        lower.startsWith('hi ') ||
        lower.startsWith('hello ') ||
        lower.startsWith('hey ') ||
        lower.includes('how are you') ||
        lower.includes('habari') ||
        lower.includes('sasa') ||
        lower.includes('niaje') ||
        lower.includes('mambo');

      if (isGreeting) {
        if (lang === 'Kiswahili') {
          replyText =
            'Jambo! Niko salama na tayari kukusaidia. Ni mada gani ya Azure ungependa tujifunze leo?';
        } else if (lang === 'Sheng') {
          replyText =
            'Niaje! Niko fiti sana. Ni topic gani ya Azure ungependa tupige leo?';
        } else {
          replyText =
            'Hi! What Azure topic would you like to cover today?';
        }
      } else if (
        lower.includes('zone') ||
        lower.includes('availability') ||
        lower.includes('datacenter') ||
        lower.includes('m-pesa')
      ) {
        if (lang === 'Kiswahili') {
          replyText =
            'Availability Zone ni kama maduka tofauti ya wakala wa M-Pesa mtaani Kasarani, Westlands, na Ngong.\n\nKila duka liko kwenye jengo tofauti lenye stima na mtandao wake wa kujitegemea. Duka moja likikosa stima, wateja wanatembea mtaa wa pili na shughuli zinaendelea bila kusimama.\n\nVivyo hivyo, ukiweka servers zako kwenye Availability Zones mbili au tatu, datacenter moja ikizima, huduma yako haikati.\n\nUngependa tupime uelewa wako na swali la mtihani kuhusu hili?';
        } else if (lang === 'Sheng') {
          replyText =
            'Availability Zone ni kama ma-agent wa M-Pesa kwa mtaa tofauti: Westy, Rongai, na tao.\n\nAgent mmoja akishuka stima ama network ikilala, wateja wanavuka tu duka ya pili na mambo inaendelea mbele fiti.\n\nKwa Azure, uki-spread VMs zako across zones, datacenter moja ikilala, system yako inabaki hewani bila stress.\n\nUko ready tuchape swali la practice test tucheki kama umeshika?';
        } else {
          replyText =
            'An Availability Zone is like having M-Pesa agent booths in separate neighborhoods - Westlands, Kasarani, and Ngong.\n\nEach booth has its own independent power, cooling, and fiber connection. If the Westlands branch loses power, customers simply walk over to Kasarani and continue transacting seamlessly.\n\nIn Azure, hosting your workloads across multiple Availability Zones ensures your application stays online even if an entire physical datacenter goes dark.\n\nReady to test your mastery with a practice check on this concept?';
        }
      } else if (
        lower.includes('shared responsibility') ||
        lower.includes('responsibility') ||
        lower.includes('matatu')
      ) {
        if (lang === 'Kiswahili') {
          replyText =
            'Shared Responsibility Model ni kama kusafiri na matatu ya Super Metro:\n\nDereva na mmiliki wanawajibika na injini, breki, na petroli (miundombinu ya Microsoft). Lakini mkoba wako, simu yako, na jinsi unavyofunga mkanda ni jukumu lako mwenyewe (data na usalama wako).\n\nKwenye IaaS, unawajibika na mfumo (OS) na programu. Kwenye SaaS (kama Microsoft 365), Microsoft inabeba karibu kila kitu isipokuwa data na watumiaji wako.\n\nJe, ungependa swali la practice check kuona jinsi AZ-900 inavyouliza hili?';
        } else if (lang === 'Sheng') {
          replyText =
            'Shared Responsibility Model ni kama kupanda nganya ya Super Metro:\n\nDere na dereva wanashughulikia gari, engine, na mafuta (hiyo ni kazi ya Microsoft). Lakini simu yako kwa mfuko na seatbelt yako ni jukumu lako mwenyewe (hiyo ni data na password zako).\n\nKwenye IaaS unajipanga na OS na apps. Kwenye SaaS kama Office 365, Microsoft inashughulikia kila kitu, wewe kazi yako ni data na ma-user wako.\n\nNikuwekee swali la practice uone kama umeshika risto?';
        } else {
          replyText =
            'The Shared Responsibility Model is like commuting in a Nairobi matatu:\n\nThe SACCO and driver are responsible for the vehicle, engine health, tires, and fuel (the underlying cloud infrastructure managed by Microsoft). However, protecting your phone, handbag, and buckling your seatbelt is strictly your own responsibility (customer data, passwords, and access).\n\nIn IaaS you manage OS and apps; in SaaS (like Microsoft 365), Microsoft handles almost everything except your data and identities.\n\nWould you like a quick check question to see how the AZ-900 exam tests this?';
        }
      } else if (
        lower.includes('capex') ||
        lower.includes('opex') ||
        lower.includes('cost') ||
        lower.includes('spending')
      ) {
        if (lang === 'Kiswahili') {
          replyText =
            'CapEx (Capital Expenditure) ni kama kununua gari lako mwenyewe: unalipa pesa nyingi mwanzo, unalipia gereji, na bima hata kama halisafiri.\n\nOpEx (Operational Expenditure) ni kama kulipa nauli ya kila safari unaposafiri: unalipia tu huduma unayotumia kwa sasa bila gharama kubwa za mwanzo.\n\nWingu la Azure linafuata mtindo wa OpEx (consumption-based pricing).\n\nUngependa nijaribu swali la mtihani la AZ-900 kuhusu gharama hizi?';
        } else if (lang === 'Sheng') {
          replyText =
            'CapEx ni kubuy gari yako cash: unatoa ganji mob upfront, kisha service na insurance ni juu yako hata gari ikikaa parking.\n\nOpEx ni kulipa fare ya matatu kila trip: unatoa doo ya ile safari umetumia tu bila deni kubwa ya kuanza.\n\nCloud kama Azure inatumia OpEx (consumption model) - unalipia tu kile unatumia kwa dakika au saa.\n\nNikugongee swali la practice uone vile exam huuliza hii kitu?';
        } else {
          replyText =
            'CapEx (Capital Expenditure) is like buying a personal car upfront: significant initial cash outlay, plus ongoing maintenance costs even when parked.\n\nOpEx (Operational Expenditure) is like paying daily matatu bus fare: no massive upfront capital, and you only pay for the exact distance you travel.\n\nAzure cloud runs primarily on OpEx (pay-as-you-go consumption model).\n\nWould you like a sample AZ-900 practice check on CapEx vs OpEx?';
        }
      } else if (
        lower.includes('storage') ||
        lower.includes('tier') ||
        lower.includes('blob') ||
        lower.includes('archive')
      ) {
        if (lang === 'Kiswahili') {
          replyText =
            'Azure Blob Storage Tiers ni kama jinsi unavyoweka vyakula na stakabadhi nyumbani:\n\n1. Hot Tier: Meza ya kulia - chakula unachokula leo. Gharama ya kuhifadhi ni juu kidogo lakini kuipata ni haraka na nafuu.\n2. Cool Tier: Friji - unakula mara moja kwa wiki.\n3. Cold Tier: Kabati ya stoo - unakagua mara moja kwa mwezi.\n4. Archive Tier: Vyeti kwenye sefu ya benki - hufungui kwa miaka mingi. Gharama ya kuhifadhi ni nafuu sana, lakini ukihitaji inachukua masaa kadhaa kurejesha (rehydration).\n\nUngependa tupime hili kwa swali la mtihani?';
        } else if (lang === 'Sheng') {
          replyText =
            'Blob Storage Tiers ni kama vile unavyoweka vitu zako za mtaa:\n\n1. Hot Tier: Mfuko wa koti - vitu unatumia kila dakika (kama simu na keys). Storage cost iko juu kiasi lakini kuichukua ni chapchap na free.\n2. Cool Tier: Droo ya meza - vitu unatumia mara moja kwa mwezi.\n3. Cold Tier: Sanduku ya kitanda - unacheki baada ya miezi kadhaa.\n4. Archive Tier: Vyeti kwa safe ya bank - haufungui kwa miaka. Bei ya storage ni cheeeap sana, lakini kurejesha huchukua masaa (rehydration).\n\nUko ready kwa practice check ya hii story?';
        } else {
          replyText =
            'Azure Blob Storage access tiers are like how you store documents at home:\n\n1. Hot Tier: Your desk top - files accessed constantly. Higher storage cost, but lowest access fees.\n2. Cool Tier: Filing cabinet - accessed monthly (30-day minimum retention).\n3. Cold Tier: Closet storage - accessed rarely (90-day minimum retention).\n4. Archive Tier: Bank safety deposit box - stored for years (180-day minimum). Lowest storage cost, but retrieval takes several hours (rehydration).\n\nWould you like an AZ-900 exam practice check on storage tiers?';
        }
      } else {
        if (lang === 'Kiswahili') {
          replyText =
            'Huu ni msingi muhimu wa mtihani wa Microsoft Azure Fundamentals (AZ-900).\n\nFikiria ushirikiano wa chama au SACCO: Azure Policy ni sheria ndogo za kaunti ambazo kila mwanachama lazima afuate, naye Azure RBAC ni uamuzi wa nani amepewa funguo za kufungua sefu ya pesa.\n\nKwenye Azure, tunatumia Resource Groups kupanga miradi, na Management Groups kusimamia kampuni yenye subscriptions nyingi.\n\nSwali la kujipima: Chini ya Azure Governance, ni huduma gani inazuia rasilimali zisifutwe kimakosa: Azure Policy au Resource Locks?';
        } else if (lang === 'Sheng') {
          replyText =
            'Hii risto ni ya nguvu sana kwenye mtihani wa AZ-900 Azure fundamentals.\n\nFikiria SACCO ya mtaa: Azure Policy ni zile sheria za county hall kila msee lazima afuate, lakini Azure RBAC ni kuchagua nani anashika funguo za safe ya ganji.\n\nKwa Azure, Resource Locks inazuia msee yeyote kufuta production database kimakosa hata akiwa admin.\n\nSwali la kujipima: Kuzuia mtu asifute subscription kimakosa, unatumia CanNotDelete lock ama ReadOnly lock?';
        } else {
          replyText =
            'This concept is a core pillar of the Microsoft Azure Fundamentals (AZ-900) curriculum.\n\nThink of a SACCO office: Azure Policy enforces the county by-laws that every branch must follow, while Azure RBAC determines which staff members hold keys to specific offices.\n\nIn Azure, Resource Locks prevent accidental deletion, while Azure Policy enforces compliance standards across subscriptions.\n\nQuick check: Which Azure feature prevents accidental deletion of mission-critical production databases?';
        }
      }

      const aiMsg = {
        id: `a${Date.now()}`,
        role: 'ai',
        text: replyText,
        lang,
      };
      const next = [...updated, aiMsg];
      setMessages(next);
      setTyping(false);

      if (!isSupabaseConfigured()) {
        saveLocalMessages(next);
      } else if (user?.id) {
        try {
          supabase.from('chat_messages').insert([
            {
              user_id: user.id,
              role: 'ai',
              text: replyText,
              lang,
            },
          ]);
        } catch (e) {
          console.warn('Could not persist AI reply:', e);
        }
      }
    }, 600);
  };

  // Determine if we are currently in an empty state
  const isChatEmpty =
    messages.length === 0 ||
    (messages.length === 1 && messages[0]?.id === 'init-1');

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] w-full max-w-[720px] flex-col px-4 pt-6 pb-4 sm:px-6">
      {/* 2. HEADER */}
      <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3.5 dark:border-[#222222] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#007BA7]/15 text-[#007BA7] dark:bg-[#0b2f3d] dark:text-[#3bb4dd]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#101213] dark:text-white">
              Study Buddy
            </h1>
            <p className="text-xs text-[#5B666E] dark:text-slate-400">
              Kenyan analogies for AZ-900
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearChat}
          aria-label="Clear chat"
          title="Clear chat history"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DDE3E8] bg-white text-[#5B666E] hover:border-[#FF007F] hover:text-[#FF007F] dark:border-[#262626] dark:bg-transparent dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* CHAT AREA / EMPTY STATE */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4 scrollbar-thin"
      >
        {isChatEmpty ? (
          /* EMPTY STATE with 2x2 Topic Cards */
          <div className="flex h-full flex-col justify-center py-4 sm:py-6 space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101213] dark:text-white tracking-tight">
                {lang === 'English'
                  ? 'What are we studying today?'
                  : lang === 'Kiswahili'
                    ? 'Jambo! Tunasoma nini leo?'
                    : 'Niaje! Form ni gani leo?'}
              </h2>
              <p className="mt-2 text-sm text-[#5B666E] dark:text-slate-400 leading-relaxed max-w-xl">
                {lang === 'English'
                  ? 'Pick a topic or ask your own question. I explain AZ-900 with everyday Kenyan examples.'
                  : lang === 'Kiswahili'
                    ? 'Chagua mada au uliza swali lako. Ninafafanua dhana za AZ-900 kwa mifano ya kila siku ya Kenya.'
                    : 'Chagua topic ama drop swali yako. Nitaweka risto za AZ-900 na ma-analogy za mtaani.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 auto-rows-fr">
              {STARTER_TOPICS.map((topic, i) => {
                const Icon = topic.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => send(topic.prompt)}
                    className="flex h-full items-start gap-3.5 rounded-2xl border border-[#DDE3E8] bg-white p-4 text-left shadow-sm hover:border-[#007BA7] hover:scale-[1.01] active:scale-[0.99] dark:border-[#262626] dark:bg-[#121212] transition-all group"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007BA7]/10 text-[#007BA7] dark:bg-[#0b2f3d] dark:text-[#3bb4dd] group-hover:bg-[#007BA7] group-hover:text-white transition-colors">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <span className="block text-sm font-bold text-[#101213] dark:text-white">
                        {topic.title}
                      </span>
                      <span className="mt-1 block text-xs text-[#5B666E] dark:text-slate-400 leading-relaxed">
                        {topic.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ACTIVE CONVERSATION */
          <div className="space-y-4">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              const isQuiz = m.role === 'quiz';

              if (isQuiz && m.question) {
                const q = m.question;
                const isAnswered = m.revealed;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-[#007BA7]/30 bg-[#EEF7FC] p-4 text-[#101213] shadow-md dark:border-[#1f3a45] dark:bg-[#0f1a1f] dark:text-[#F8FAFC]"
                  >
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#DDE3E8] dark:border-[#1f2d3a]">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF007F]">
                          QUICK CHECK
                        </span>
                        <span className="text-xs font-bold text-[#007BA7]">
                          • {q.objective || q.topic_id || 'Azure Concept'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#5B666E] dark:text-slate-400">
                        Difficulty:{' '}
                        {q.difficulty === 1
                          ? 'Beginner'
                          : q.difficulty === 2
                            ? 'Intermediate'
                            : 'Advanced'}
                      </span>
                    </div>

                    <p className="mb-3 text-sm font-semibold leading-relaxed text-[#101213] dark:text-[#F8FAFC]">
                      {q.question}
                    </p>

                    <div className="space-y-2 mb-3">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = m.selectedOption === optIdx;
                        const isCorrect = optIdx === q.answerIndex;
                        let btnClass =
                          'border-[#DDE3E8] bg-white text-[#101213] hover:border-[#007BA7] hover:bg-[#EEF7FC] dark:border-[#242424] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:bg-[#181818]';

                        if (isAnswered) {
                          if (isCorrect) {
                            btnClass =
                              'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/40 dark:text-emerald-200';
                          } else if (isSelected) {
                            btnClass =
                              'border-[#FF007F] bg-[#FF007F]/10 text-[#FF007F] font-bold dark:bg-[#FF007F]/15';
                          } else {
                            btnClass =
                              'border-[#DDE3E8] bg-slate-100 text-[#5B666E] opacity-60 dark:border-[#1f2428] dark:bg-[#0c1014] dark:text-slate-500';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isAnswered}
                            onClick={() => handleAnswerQuiz(m.id, q, optIdx)}
                            className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left text-xs transition-all ${btnClass}`}
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#DDE3E8] text-[#5B666E] dark:border-[#333] dark:text-slate-300 text-[10px] font-bold">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 leading-normal">{opt}</span>
                            {isAnswered && isCorrect && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            )}
                            {isAnswered && isSelected && !isCorrect && (
                              <XCircle className="h-4 w-4 shrink-0 text-[#FF007F]" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="rounded-xl border border-[#DDE3E8] bg-white p-3 text-xs dark:border-[#1f2d3a] dark:bg-[#121820]"
                      >
                        <p className="font-semibold text-[#101213] dark:text-white mb-1 flex items-center gap-1.5">
                          {m.selectedOption === q.answerIndex ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Correct! Safi sana.</span>
                            </>
                          ) : (
                            <>
                              <Lightbulb className="h-3.5 w-3.5 text-[#007BA7]" />
                              <span>Why right, why wrong:</span>
                            </>
                          )}
                        </p>
                        <p className="text-[#333] dark:text-slate-300 leading-relaxed mb-2">
                          {q.explanation}
                        </p>
                        {q.wrongExplanations &&
                          m.selectedOption !== q.answerIndex &&
                          q.wrongExplanations[m.selectedOption] && (
                            <p className="text-[#FF007F] text-[11px] mb-2 font-medium">
                              Option {String.fromCharCode(65 + m.selectedOption)}:{' '}
                              {q.wrongExplanations[m.selectedOption]}
                            </p>
                          )}
                        <div className="flex items-center justify-between pt-2 border-t border-[#DDE3E8] dark:border-[#223242]">
                          <span className="text-[11px] text-[#5B666E] dark:text-slate-400">
                            Recorded to your readiness score
                          </span>
                          <button
                            onClick={() => navigate('quiz')}
                            className="text-[11px] font-bold text-[#007BA7] hover:underline"
                          >
                            Full Practice Mode →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007BA7]/15 text-[#007BA7] dark:bg-[#0b2f3d] dark:text-[#3bb4dd]">
                      <Bot className="h-4 w-4" />
                    </span>
                  )}
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div
                      className={`rounded-2xl p-4 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#007BA7] text-white font-medium self-end rounded-br-sm'
                          : 'border border-[#DDE3E8] bg-white text-[#101213] dark:border-[#242424] dark:bg-[#121212] dark:text-[#e6ebee] rounded-tl-sm whitespace-pre-line shadow-sm'
                      }`}
                    >
                      {m.text}
                    </div>

                    {!isUser && m.id !== 'init-1' && (
                      <div className="flex items-center gap-2 pl-1">
                        <button
                          onClick={() => handleQuizMe(m)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#007BA7]/40 bg-[#007BA7]/10 px-2.5 py-1 text-xs font-semibold text-[#007BA7] hover:bg-[#007BA7] hover:text-white transition-all active:scale-95"
                        >
                          <Target className="h-3.5 w-3.5" />
                          Quiz me on this
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007BA7]/15 text-[#007BA7] dark:bg-[#0b2f3d] dark:text-[#3bb4dd]">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="rounded-2xl border border-[#DDE3E8] bg-white px-4 py-3 text-xs text-[#5B666E] dark:border-[#242424] dark:bg-[#121212] dark:text-slate-400">
                  Your Study Buddy is preparing your Kenyan analogy in {lang}...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. PINNED BOTTOM AREA */}
      <div className="shrink-0 pt-2 space-y-2">
        {/* Suggested Prompts (Hidden in empty state; soft fade on right edge; no scrollbars) */}
        {!isChatEmpty && (
          <div className="relative">
            <div
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {SUGGESTED_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => send(p.prompt)}
                  className="shrink-0 rounded-full border border-[#DDE3E8] bg-white px-3.5 py-1.5 text-xs text-slate-700 hover:border-[#007BA7] hover:text-[#007BA7] dark:border-[#2f2f2f] dark:bg-[#121212] dark:text-slate-300 dark:hover:border-[#007BA7] dark:hover:text-white transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            {/* Soft fade on the right edge */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-[#F6F8FA] dark:from-[#050505] to-transparent" />
          </div>
        )}

        {/* Message Input Line with Language Dropdown on Left */}
        <div className="relative flex items-center gap-2.5">
          {/* 3. Compact Language Selector Button */}
          <div ref={langMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              aria-label="Change language"
              className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl border border-[#DDE3E8] bg-white px-3 text-xs font-bold text-[#101213] hover:border-[#007BA7] dark:border-[#2f2f2f] dark:bg-[#121212] dark:text-white transition-all shadow-sm"
            >
              <Globe className="h-4 w-4 text-[#007BA7] dark:text-[#3bb4dd]" />
              <span>{langFlag[lang] || 'EN'}</span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Upward Dropdown Menu */}
            {langMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-36 rounded-xl border border-[#DDE3E8] bg-white p-1.5 shadow-xl dark:border-[#262626] dark:bg-[#121212] z-40 animate-fade-up">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#DDE3E8] dark:border-[#202020] mb-1">
                  Language
                </div>
                {languages.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => handleLanguageSelect(l)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      lang === l
                        ? 'bg-[#007BA7]/10 text-[#007BA7] font-bold dark:bg-[#007BA7]/20 dark:text-[#3bb4dd]'
                        : 'text-[#101213] hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#181818]'
                    }`}
                  >
                    <span>{l}</span>
                    {lang === l && <Check className="h-3.5 w-3.5 text-[#007BA7] dark:text-[#3bb4dd]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex-1 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Ask about any AZ-900 topic in ${lang}...`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 h-12 rounded-xl border border-[#DDE3E8] bg-white px-4 text-sm font-medium text-[#101213] placeholder-slate-400 focus:border-[#007BA7] focus:outline-none dark:border-[#2f2f2f] dark:bg-[#121212] dark:text-white dark:placeholder-slate-500 shadow-sm transition-all"
            />
            <button
              type="submit"
              disabled={!draft.trim() || typing}
              aria-label="Send message"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#007BA7] to-[#FF007F] text-white shadow-sm hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
