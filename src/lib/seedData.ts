export interface InitialRecording {
  id: string;
  created_at: string;
  duration: number;
  audio_file_path: string;
  transcript: string;
  summary: string;
  status: "completed" | "processing" | "failed_transcription" | "failed_summary";
  error_message?: string | null;
}

export const INITIAL_RECORDINGS: InitialRecording[] = [
  {
    "id": "rec_1791354066493_mtc8n",
    "created_at": "2026-10-07T06:21:06.507Z",
    "duration": 86,
    "audio_file_path": "rec_1791354066493_mtc8n.webm",
    "transcript": "Speaker 1: क्या करना है?\nSpeaker 1: वही वाला ना जिसमें प्रॉपर्टी है।\nSpeaker 2: हेलो\nSpeaker 1: हेलो\nSpeaker 2: गुड आफ्टरनून सर मैं रिया बात कर रही हूं श्रीमा शांति विरान वेस्ट से।\nSpeaker 1: हां बोलो।\nSpeaker 2: सर आपकी इंक्वायरी ऐसे हुई थी मुझे प्रॉपर्टी परचेस के लिए तो मैं जान सकती हूं क्या देख रहे हो 1 बीएचके 2 बीएचके?\nSpeaker 1: नहीं मैंने तो कोई इंक्वायरी नहीं की।\nSpeaker 2: सर हमारे सिस्टम में शो हो रहा है आपकी इंक्वायरी।\nSpeaker 1: अच्छा लेकिन मैंने तो की नहीं है।\nSpeaker 2: आपकी फैमिली या कोई फ्रेंड सर्कल में किया होगा सर।\nSpeaker 1: किया हो सकता है बताओ।\nSpeaker 2: तो आप क्या देख रहे हैं अगर इन फ्यूचर आप सर्च करना चाहेंगे तो आ रहा है।\nSpeaker 1: 2 बीएचके देख रहा हूं।\nSpeaker 2: सर हमारे पास 2 बीएचके में दो कारपेट एरिया है। एक 66 676 का एक 672 का है।\nSpeaker 1: अच्छा तो क्या प्राइस रहेगा?\nSpeaker 2: ये सर 67 लाख ऑनवर्ड्स जाता है।\nSpeaker 1: एमेनिटीज क्या-क्या है?\nSpeaker 2: एमेनिटीज सर हमारे पास 15 प्लस एमेनिटीज है जिसमें किड्स प्ले एरिया सीनियर सीनियर सिटीजन एरिया और मल्टीपल है सर हमारे पास।\nSpeaker 1: और कब तक मिलेगा मेरे को प्रोजेक्ट?\nSpeaker 2: अह छह से आठ मंथ का पजेशन है सर उसका।\nSpeaker 1: मेरे को जल्दी चाहिए था थोड़ा।\nSpeaker 2: पॉसिबल नहीं है सर उतना तो।\nSpeaker 1: अच्छा ठीक है।\nSpeaker 2: वैसे रहने के लिए कहां पे हो?\nSpeaker 1: मैं सांता क्रूज में रहता हूं अभी इन्वेस्टमेंट के लिए सोच रहा था कि देख रहा हूं।\nSpeaker 2: ओके सर चलेगा।\nSpeaker 1: तो फ्यूचर कुछ है कि नहीं वहां पे इन्वेस्ट करना चाहिए या नहीं मुझे विरार में?\nSpeaker 2: देख लो सर।\nSpeaker 1: अच्छा ठीक है आप नहीं बता पाओगे क्या?\nSpeaker 2: नहीं।\nSpeaker 1: ठीक है कोई बात नहीं देखता हूं मैं विजिट।",
    "summary": "{\"overall_summary\":\"A sales representative from Shreema Shanti Virar West contacted a client who had an inquiry regarding property purchase, though the client initially stated he did not make the inquiry. The conversation progressed to discuss 2 BHK properties, pricing starting at 67 lakhs, amenities, and a possession timeline of 6 to 8 months, with the client ultimately mentioning he is looking for investment purposes from Santa Cruz.\",\"key_discussion_points\":[\"Client stated he did not personally make the property inquiry, but acknowledged someone from his family or friend circle might have.\",\"Client is looking for a 2 BHK property for investment purposes.\",\"Sales representative shared 2 BHK carpet area options of 676 and 672 sq. ft. starting at 67 lakhs onwards.\",\"Project includes over 15 amenities such as a kids' play area and senior citizen area.\",\"Possession timeline is 6 to 8 months, which the client found a bit too late as he wanted it sooner.\",\"Client currently lives in Santa Cruz and asked about the investment potential in Virar, to which the representative was unable to provide a detailed answer.\"],\"pitch_score\":4,\"pitch_percentage\":40}",
    "status": "completed",
    "error_message": null
  },
  {
    "id": "rec_1791353909135_h7fvh",
    "created_at": "2026-10-07T06:18:29.153Z",
    "duration": 105,
    "audio_file_path": "rec_1791353909135_h7fvh.webm",
    "transcript": "Speaker 1: Hello. Good afternoon. Sir, boliye.\nSpeaker 2: Sir, main yeh baat karu Shripa Shanti Vihar West se.\nSpeaker 1: Sir, aapki enquiry aayi hui thi mujhe property purchase ke liye to main jaan sakti hu aap kya dekh rahe ho, 1 BHK, 2 BHK?\nSpeaker 2: I'm talking about 2 BHK.\nSpeaker 1: Okay, sir. 1 BHK mein hamare paas do carpet area hai, ek 476 ka aur ek 491 ka.\nSpeaker 2: Ji, sir yeh G plus 23 storey ki building hai. Yeh Vihar West, Vihar Nagar mein located hai.\nSpeaker 1: Toh carpet area kya bataya?\nSpeaker 2: Ek 476 ka hai, ek 491 ka hai.\nSpeaker 1: Price kya banega?\nSpeaker 2: Starting sir, 45 lakh onwards hai.\nSpeaker 1: 470?\nSpeaker 2: 476 ka hai aur?\nSpeaker 1: 491 ka hai.\nSpeaker 2: 476 ka kya price hai?\nSpeaker 1: 45 lakh onwards hai, sir.\nSpeaker 2: Onwards hai, exact nahi bata sakte aap?\nSpeaker 1: Nahi, sir yeh hume allow nahi hai, main caller team se hu. Aap yahan pe aayenge na toh hamare sales person aapko explain kar denge.\nSpeaker 2: Kahan pe hai aapka project?\nSpeaker 1: Yeh Vihar Nagar mein hai, sir, Vihar West mein.\nSpeaker 2: Ji. Waise aap kahan pe rehte ho?\nSpeaker 1: Main toh abhi Andheri mein rehta hu.\nSpeaker 2: Okay.\nSpeaker 1: Toh sir, aapko site visit ke liye kab possible hoga?\nSpeaker 2: Abhi toh time nahi hai mere paas, filhaal. Aap batao na pehle project ke bare mein amenities kya-kya hai?\nSpeaker 1: Sir, aapko isme na 50 plus amenities mil jaate hai, jaise kids play area, senior citizen area.\nSpeaker 2: Achcha.\nSpeaker 1: Yes, sir. Aur multiple option hai, sir, hamare paas amenities mein.\nSpeaker 2: Possession kab tak milega?\nSpeaker 1: Yeh chhe se aath month mein possession mil raha hai, sir.\nSpeaker 2: Achcha, aur late hua toh?\nSpeaker 1: Nahi, sir. Humne bahut saare projects hamare possession se pehle kiye hai deliver.",
    "summary": "{\"overall_summary\":\"The sales caller contacted a client who had inquired about purchasing a property in Shripa Shanti Vihar West. They discussed 2 BHK configurations, pricing starting from 45 lakhs onwards, project location, 50 plus amenities, and an expected possession timeline of six to eight months.\",\"key_discussion_points\":[\"Property configuration of 2 BHK with carpet areas of 476 and 491 square feet\",\"Starting price of 45 lakhs onwards\",\"Project location in Vihar Nagar, Vihar West, featuring a G plus 23 storey building\",\"Inclusion of over 50 amenities such as kids play area and senior citizen area\",\"Possession timeline of 6 to 8 months\"],\"pitch_score\":7,\"pitch_percentage\":70}",
    "status": "completed",
    "error_message": null
  },
  {
    "id": "rec_1791291355543_pquwj",
    "created_at": "2026-10-06T13:05:55.543Z",
    "duration": 120,
    "audio_file_path": "rec_1788863273211_di3zj.webm",
    "transcript": "Sales Rep: Hello sir, good evening. Calling from Shripal Shanti customer desk.\nClient: Yes, please tell me.\nSales Rep: Sir, you had inquired about our 2 BHK premium residential flats in Virar.\nClient: Yes, I am looking for a 2 BHK around 60 to 70 lakhs budget with parking.\nSales Rep: Absolutely sir. We have 2 BHK master configurations starting from 62 lakhs with carpet area of 645 sq. ft., including reserved covered car parking.\nClient: When can we visit the site?\nSales Rep: Sir, we are open all seven days. We can arrange a site pickup for you this Saturday.\nClient: Great, please share the location and brochure on WhatsApp, I will confirm the time.\nSales Rep: Sure sir, sending details right away. Thank you!",
    "summary": "{\"pitch_score\":8,\"pitch_percentage\":80,\"overall_summary\":\"Comprehensive sales call presenting 2 BHK residential configurations at Virar with pricing between 60 to 70 lakhs. Client requested brochure on WhatsApp and agreed to schedule a weekend site visit.\",\"key_discussion_points\":[\"Client seeking 2 BHK flat within 60-70 Lakhs budget with reserved parking.\",\"Sales rep explained 645 sq. ft. master layout starting at 62 Lakhs.\",\"Pickup service offered for upcoming weekend site visit.\"],\"client_requirements\":[\"2 BHK Configuration\",\"Budget 60-70 Lakhs\",\"Reserved Car Parking\"],\"important_questions_concerns\":[\"Site visit timing and location details\"],\"action_items\":[\"Send digital brochure and Google Map location on WhatsApp\"],\"next_steps\":[\"Confirm Saturday site visit timing with client\"]}",
    "status": "completed",
    "error_message": null
  },
  {
    "id": "rec_1791291001140_gr2mr",
    "created_at": "2026-10-06T13:01:01.140Z",
    "duration": 5,
    "audio_file_path": "rec_1788862633941_smjxt.webm",
    "transcript": "Client: Hello?\nSales Rep: Good evening sir, calling from sales team.\nClient: I am driving right now. Please call back tomorrow morning.\nSales Rep: Sure sir, will call you at 11 AM.",
    "summary": "{\"pitch_score\":7,\"pitch_percentage\":70,\"overall_summary\":\"Brief outreach call. Client was driving and requested a morning callback at 11:00 AM.\",\"key_discussion_points\":[\"Client currently occupied while driving.\",\"Agreed callback scheduled for tomorrow at 11:00 AM.\"],\"client_requirements\":[\"Not mentioned\"],\"important_questions_concerns\":[\"Client unavailable at time of call\"],\"action_items\":[\"Set CRM task for follow-up tomorrow at 11:00 AM\"],\"next_steps\":[\"Call client tomorrow morning\"]}",
    "status": "completed",
    "error_message": null
  },
  {
    "id": "rec_1791290588438_7knym",
    "created_at": "2026-10-06T12:53:08.438Z",
    "duration": 96,
    "audio_file_path": "rec_1788862633941_smjxt.webm",
    "transcript": "Sales Rep: Hello ma'am, Shripal sales office here. Regarding your inquiry on commercial and residential units.\nClient: Actually I wanted ready possession shops, do you have commercial shops ready?\nSales Rep: Commercial shops are in the under-construction tower, possession is after 14 months.\nClient: No, I need immediate possession for business setup.\nSales Rep: Okay ma'am, I will check if any resale or investor unit is available and update you.\nClient: Okay, update me if ready unit is there.",
    "summary": "{\"pitch_score\":5,\"pitch_percentage\":50,\"overall_summary\":\"Client inquired about commercial shop units with ready possession. Since current project shops have 14 months remaining, sales representative will verify available investor units.\",\"key_discussion_points\":[\"Client requirement is urgent ready-possession shop for business setup.\",\"Current project inventory has 14-month construction possession timeline.\",\"Sales rep offered to check secondary/investor ready units.\"],\"client_requirements\":[\"Commercial retail shop\",\"Immediate ready possession\"],\"important_questions_concerns\":[\"Project possession delay does not match client urgent timeline\"],\"action_items\":[\"Check internal resale inventory for immediate possession options\"],\"next_steps\":[\"Contact client if ready commercial unit becomes available\"]}",
    "status": "completed",
    "error_message": null
  },
  {
    "id": "rec_1788863273211_di3zj",
    "created_at": "2026-09-08T10:27:53.224Z",
    "duration": 105,
    "audio_file_path": "rec_1788863273211_di3zj.webm",
    "transcript": "Client: Hello.\nSales Person: Hello. Good afternoon, ma'am.\nClient: Good afternoon.\nSales Person: Ma'am, is Srishti Vats from Shripal Shanti here?\nClient: Yes.\nSales Person: Ma'am, aapki inquiry receive hui thi Shripal Shanti mein property purchase karne ka plan kar rahe ho?\nClient: Ah, ha.\nSales Person: Kya dekh rahe ho ma'am, aise? Aur kya aapke paas options hain?\nClient: One BHK, two BHK, dono options hain ma'am. Aap kya dekh rahe ho?\nSales Person: Um, actually main three BHK dekh rahi hoon. Aisa kuch option hai aapke paas?\nClient: Aur three BHK ma'am, hamare paas Jodi options aapko mil jayenge.\nSales Person: Okay, great.\nSales Person: Ma'am, aap kahan rehte ho?\nClient: Main Virar mein rehti hoon, Ekta mein.\nSales Person: Okay, toh ye aapke paas hi ma'am, aap Vaikenagar location pe hamara project hai. Tanjali Road pe aapko idea hoga.\nClient: Ha, ha, idea toh hai.\nSales Person: Toh ma'am, ye directly builder office se stand hoti hai na?\nClient: Ha, builder office se baat kar rahi hoon ma'am main.\nSales Person: Achcha, theek hai.\nSales Person: Toh abhi under construction hai ma'am, 20 slab tak ready ho chuka hai.\nClient: Hmm.\nSales Person: Aapko next year June-July tak possession mil jayega.\nClient: Okay.\nSales Person: Toh abhi plan kar rahe ho na visit ke liye, aaj possible hai kya?\nClient: Aaj toh possible nahi hai, main aapko Sunday ko batati hoon.\nSales Person: Okay, chalega ma'am. Apna seven days office chalu rehta hai.\nClient: Hmm.\nSales Person: Kabhi bhi aap aao, direct aana ma'am. Main builder office se baat kar rahi hoon.\nClient: Hmm.\nSales Person: Usme kya aapko pricing benefit milta hai.\nClient: Arre, mereko na ek CP ne bhi approach kiya tha. Matlab aapke project ke liye approach kiya tha.\nSales Person: Ma'am, woh channel partners rehte hain hamare.\nClient: Ha.\nSales Person: But main direct builder office se baat kar rahi hoon. Aap mera number save kar lijiye.\nClient: Hmm.\nSales Person: Jab bhi aayenge toh mujhe call kar dijiyega. Hamara pickup bhi rehta hai, main car bhi bhej dunga Ekta ki building ke paas.\nClient: Okay. But agar main CP ke saath aaungi toh koi dikkat hai kya?\nSales Person: Wohi mujhe dikha rahe the.\nClient: Hmm.\nSales Person: Direct aayenge toh ma'am, main aapko discount karke de sakti hoon.\nClient: On table.\nSales Person: Aap direct aaoge toh.\nClient: Achcha, matlab CP ke saath aate hain toh matlab mujhe CP ko pay karna padega, aisa?\nSales Person: Hmm.\nClient: Theek hai.\nSales Person: Theek hai.",
    "summary": "{\"pitch_score\":9,\"pitch_percentage\":90,\"overall_summary\":\"This meeting was a follow-up sales call from Shripal Shanti builder office to a client inquiring about purchasing property in Virar. The discussion covered available configurations (1 BHK, 2 BHK, and Jodi 3 BHK options), construction status (20 slabs ready), and the benefits of direct visits without channel partners.\",\"key_discussion_points\":[\"Client interested in property purchase, looking for 3 BHK Jodi options in Virar (Ekta area).\",\"Project location at Vaikenagar, Tanjali Road; 20 slabs ready with possession expected next year June-July.\",\"Sales representative offered car pickup service from Ekta building and on-table discount for direct builder visits.\",\"Client to confirm site visit on Sunday.\"]}",
    "status": "completed",
    "error_message": null
  },
  {
    "id": "rec_1788862633941_smjxt",
    "created_at": "2026-09-08T10:17:13.947Z",
    "duration": 65,
    "audio_file_path": "rec_1788862633941_smjxt.webm",
    "transcript": "Speaker 1: Hello everyone. Today we are analyzing why sales have dropped this quarter.\nSpeaker 2: Yes, looking at the data, lead response time increased from 5 minutes to 45 minutes.\nSpeaker 1: That is critical. We need to implement automated lead routing immediately.",
    "summary": "{\"pitch_score\":8.2,\"pitch_percentage\":82,\"overall_summary\":\"The meeting focused on analyzing sales performance and addressing the recent decline in conversion rates.\",\"key_discussion_points\":[\"Analysis of quarterly sales drop and response time delay from 5 to 45 minutes.\",\"Agreement to implement automated lead routing immediately.\"]}",
    "status": "completed",
    "error_message": null
  }
];
