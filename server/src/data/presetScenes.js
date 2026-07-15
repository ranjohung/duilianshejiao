module.exports = [
  {
    id: 'scene_coffee_break',
    name: '咖啡厅破冰',
    stage: '破冰期',
    difficulty: 'easy',
    description: '在咖啡厅和陌生人开启一段轻松对话',
    total_rounds: 5,
    unlock_condition: { min_points: 0, min_level: 'bronze' },
    teaching_points: ['眼神接触', '开放性问题', '积极倾听', '自然延续话题', '友好告别'],
    npc_name: '咖啡厅陌生人',
    npc_avatar: '/assets/npc/stranger_coffee.png',
    opening: '你走进一家咖啡厅，发现只有吧台旁边还有一个空位。旁边坐着一个人正在看书。你会怎么做？',
    rounds: [
      {
        round: 1,
        situation: '你坐在吧台旁，旁边的人在看书。你想开启对话。',
        coach_hint: '尝试用环境话题作为切入点，比如咖啡、天气或对方的书',
        options: [
          '你好，这本书我也看过，很不错！',
          '（沉默等待对方先开口）',
          '这里的咖啡真不错，你常来吗？'
        ],
        ideal_response_type: 'open_question',
        scoring: { communication: 15, expression: 10, empathy: 10, emotion_control: 10, adaptability: 5 }
      },
      {
        round: 2,
        situation: '对方抬头看了你一眼，似乎愿意聊天。',
        coach_hint: '延续话题，用开放性问题深入了解对方兴趣',
        options: [
          '你平时喜欢看什么类型的书？',
          '嗯...（不知说什么好）',
          '我是第一次来这里，你有什么推荐吗？'
        ],
        ideal_response_type: 'open_question',
        scoring: { communication: 15, expression: 15, empathy: 10, emotion_control: 5, adaptability: 5 }
      },
      {
        round: 3,
        situation: '对方开始热情地聊起自己的兴趣爱好。',
        coach_hint: '积极倾听，用回应和追问展示你的关注',
        options: [
          '原来如此！那你是怎么开始对这个感兴趣的？',
          '哦，挺好的。（没有追问）',
          '我也很喜欢这个！你最近有什么新发现吗？'
        ],
        ideal_response_type: 'active_listening',
        scoring: { communication: 10, expression: 10, empathy: 20, emotion_control: 10, adaptability: 10 }
      },
      {
        round: 4,
        situation: '对话渐入佳境，你可以选择深入或转换话题。',
        coach_hint: '根据对方反应灵活调整，适时分享自己相关经历',
        options: [
          '说起来我也有类似的经历...',
          '（一直点头但不太说话）',
          '对了，你在这一带住很久了吗？'
        ],
        ideal_response_type: 'self_disclosure',
        scoring: { communication: 15, expression: 15, empathy: 10, emotion_control: 5, adaptability: 15 }
      },
      {
        round: 5,
        situation: '对方看了看时间，似乎准备离开了。',
        coach_hint: '友好告别，可以暗示未来再见',
        options: [
          '今天聊得很开心！希望下次还能遇到你。',
          '（默默看对方离开）',
          '加个微信吧，有空可以一起喝咖啡！'
        ],
        ideal_response_type: 'friendly_close',
        scoring: { communication: 10, expression: 10, empathy: 15, emotion_control: 15, adaptability: 10 }
      }
    ]
  },
  {
    id: 'scene_interest_group',
    name: '兴趣社群',
    stage: '破冰期',
    difficulty: 'easy',
    description: '加入一个兴趣社群，和新朋友自然交流',
    total_rounds: 5,
    unlock_condition: { min_points: 0, min_level: 'bronze' },
    teaching_points: ['自我介绍', '寻找共同话题', '群体互动', '适度表达', '建立联系'],
    npc_name: '社群组织者',
    npc_avatar: '/assets/npc/organizer.png',
    opening: '你参加了一个读书分享社群的线下活动。组织者欢迎大家做自我介绍，轮到你了。',
    rounds: [
      {
        round: 1,
        situation: '轮到你做自我介绍，其他人在看着你。',
        coach_hint: '简洁有力地介绍自己，提到一个有趣的点引发好奇',
        options: [
          '大家好，我叫...，平时喜欢读书和跑步，很高兴认识大家！',
          '（紧张到说不出话，简单说了名字就坐下）',
          '嗨！我是...，最近在读一本特别有趣的书，想分享给大家！'
        ],
        ideal_response_type: 'engaging_intro',
        scoring: { communication: 15, expression: 20, empathy: 5, emotion_control: 5, adaptability: 5 }
      },
      {
        round: 2,
        situation: '介绍后有人主动和你搭话，问了你一个关于兴趣的问题。',
        coach_hint: '热情回应，同时反问对方，建立双向交流',
        options: [
          '对，我特别喜欢单推理小说！你呢，平时喜欢什么类型的？',
          '嗯，是的。（没有展开）',
          '哈哈是的，不过我最近也想尝试其他类型，你有推荐吗？'
        ],
        ideal_response_type: 'reciprocal_question',
        scoring: { communication: 15, expression: 10, empathy: 15, emotion_control: 5, adaptability: 5 }
      },
      {
        round: 3,
        situation: '小组讨论开始，大家轮流分享看法。轮到你了。',
        coach_hint: '在群体中适度表达，既不过于安静也不喧宾夺主',
        options: [
          '我觉得大家说得都很有道理。我想补充一点...',
          '（全程保持沉默）',
          '我完全不同意这个观点！我觉得...'
        ],
        ideal_response_type: 'balanced_expression',
        scoring: { communication: 10, expression: 15, empathy: 10, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 4,
        situation: '讨论中有人和你的观点不同，气氛有些紧张。',
        coach_hint: '尊重不同观点，用"我理解"来共情，再温和表达自己的看法',
        options: [
          '我理解你的想法，这确实有道理。我的角度是...',
          '你说得不对，应该这样看...',
          '好吧，你说得对。（放弃自己的观点）'
        ],
        ideal_response_type: 'respectful_disagreement',
        scoring: { communication: 10, expression: 10, empathy: 20, emotion_control: 15, adaptability: 5 }
      },
      {
        round: 5,
        situation: '活动结束，几个人在交流联系方式。',
        coach_hint: '主动但不过度地建立联系，选择合适的深度',
        options: [
          '今天聊得特别好！我们可以加个联系方式，下次活动一起？',
          '（悄悄提前离开）',
          '大家都加我吧！我建个群！（过于热情）'
        ],
        ideal_response_type: 'appropriate_connection',
        scoring: { communication: 10, expression: 10, empathy: 15, emotion_control: 10, adaptability: 15 }
      }
    ]
  },
  {
    id: 'scene_mock_interview',
    name: '模拟面试',
    stage: '职场期',
    difficulty: 'medium',
    description: '练习一场结构化的求职面试，从开场到结束完整走一遍',
    total_rounds: 5,
    unlock_condition: { min_points: 100, min_level: 'silver' },
    teaching_points: ['自我介绍结构化', '回答STAR法则', '反问环节', '薪资谈判技巧', '专业表达'],
    npc_name: '面试官',
    npc_avatar: '/assets/npc/interviewer.png',
    opening: '你即将参加一场求职面试。面试官已经坐在对面，微笑着看着你。深呼吸，准备开始。',
    rounds: [
      {
        round: 1,
        situation: '面试官请你做自我介绍，这是面试的第一环节。',
        coach_hint: '用结构化的方式介绍自己：基本信息→核心优势→与岗位的匹配点，控制在1-2分钟',
        options: [
          '您好，我叫...，毕业于...，有3年相关经验。我擅长...，之前在...项目中取得了...成果，非常期待这个岗位。',
          '呃...我叫...，我之前做过一些工作，具体您可以看简历...',
          '您好！我特别热爱这个行业！我做过很多事，什么都能做！'
        ],
        ideal_response_type: 'structured_intro',
        scoring: { communication: 20, expression: 15, empathy: 5, emotion_control: 5, adaptability: 5 }
      },
      {
        round: 2,
        situation: '面试官问你："请分享一个你克服困难的经历。"',
        coach_hint: '使用STAR法则回答：情境(Situation)→任务(Task)→行动(Action)→结果(Result)',
        options: [
          '当时项目遇到了技术难题(S)，我负责解决(T)。我组织了头脑风暴，查阅资料并做了原型验证(A)，最终提前两天解决了问题(R)。',
          '困难肯定有啊，我每次都能搞定，具体就不展开说了。',
          '有一次加班到很晚，我一个人把活儿全干完了，领导夸我特别能吃苦。'
        ],
        ideal_response_type: 'star_response',
        scoring: { communication: 15, expression: 20, empathy: 5, emotion_control: 5, adaptability: 5 }
      },
      {
        round: 3,
        situation: '面试官抛出一个情景问题："如果团队中出现意见分歧，你会怎么处理？"',
        coach_hint: '展现你的沟通协调能力，用具体策略而非空泛回答，体现专业素养',
        options: [
          '我会先了解各方观点，找到分歧核心，然后组织讨论，用数据和实践结果来推动共识。',
          '我会听大家的意见，然后让领导来决定。',
          '我觉得团队不应该有分歧，大家应该统一思想。'
        ],
        ideal_response_type: 'problem_solving',
        scoring: { communication: 10, expression: 15, empathy: 10, emotion_control: 10, adaptability: 15 }
      },
      {
        round: 4,
        situation: '面试官问到了你的薪资期望。',
        coach_hint: '给出合理区间而非固定数字，说明依据，展现灵活性和对岗位的重视',
        options: [
          '根据我的经验和市场了解，期望在15K-18K之间。当然，我也看重发展空间，具体可以再商量。',
          '你们能给多少就多少，我都可以。',
          '低于20K我不考虑。'
        ],
        ideal_response_type: 'negotiation',
        scoring: { communication: 10, expression: 15, empathy: 5, emotion_control: 15, adaptability: 15 }
      },
      {
        round: 5,
        situation: '面试接近尾声，面试官问："你有什么想问我们的吗？"',
        coach_hint: '这是反问环节，展现你对岗位的思考深度，避免问薪资福利等基础问题',
        options: [
          '我想了解这个岗位未来半年最重要的目标是什么？团队目前的协作方式是怎样的？',
          '没有了，您都介绍得很清楚了。',
          '请问年假有几天？加班多不多？'
        ],
        ideal_response_type: 'reverse_question',
        scoring: { communication: 10, expression: 15, empathy: 5, emotion_control: 10, adaptability: 20 }
      }
    ]
  },
  {
    id: 'scene_nvc_misunderstood',
    name: '被误解NVC',
    stage: '亲密期',
    difficulty: 'medium',
    description: '当你被误解时，用非暴力沟通(NVC)四步法化解冲突',
    total_rounds: 5,
    unlock_condition: { min_points: 80, min_level: 'silver' },
    teaching_points: ['观察事实', '表达感受', '说出需要', '提出请求', 'NVC四步法'],
    npc_name: '误解你的朋友',
    npc_avatar: '/assets/npc/misunderstanding_friend.png',
    opening: '你和朋友约好一起吃饭，对方迟到了40分钟还说是你记错了时间。你感到很委屈，对方却觉得你反应过度。',
    rounds: [
      {
        round: 1,
        situation: '朋友说："你怎么这么敏感？不就是晚了一会儿吗？"你感到被误解了。',
        coach_hint: '先识别自己的情绪，不要急着反击或压抑，觉察你此刻的感受',
        options: [
          '（深呼吸）我现在确实有点不舒服，让我先想想怎么表达...',
          '你说谁敏感？你自己迟到了还好意思说！',
          '嗯...可能是我太敏感了吧...（强忍委屈）'
        ],
        ideal_response_type: 'emotion_awareness',
        scoring: { communication: 5, expression: 10, empathy: 5, emotion_control: 25, adaptability: 5 }
      },
      {
        round: 2,
        situation: '你平静下来后，准备用NVC第一步"观察"来回应。',
        coach_hint: '只说观察到的事实，不加评判和指责，如"我们约的是6点，你6点40才到"',
        options: [
          '我们约的是6点，你6点40到的。这期间我等了你40分钟。',
          '你每次都迟到，根本不尊重我！',
          '迟到就迟到吧，也没什么大不了的。'
        ],
        ideal_response_type: 'observation',
        scoring: { communication: 15, expression: 10, empathy: 10, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 3,
        situation: '你说了事实之后，朋友沉默了一下。现在进入NVC第二步"感受"。',
        coach_hint: '表达自己的真实感受，用"我感到..."开头，而不是"你让我..."',
        options: [
          '等了40分钟后，我感到有些失落和担心，不是生你的气。',
          '你让我很生气，你知不知道等人的滋味？',
          '算了，我没什么感觉。'
        ],
        ideal_response_type: 'feeling',
        scoring: { communication: 10, expression: 20, empathy: 10, emotion_control: 10, adaptability: 10 }
      },
      {
        round: 4,
        situation: '朋友表情缓和了一些。进入NVC第三步"需要"。',
        coach_hint: '说出自己的需要，将感受和需要关联，如"我需要被尊重和确定感"',
        options: [
          '因为我很看重我们的约定，我需要一些确定感，这样我才能安心等待。',
          '你就是不把我当回事，我需要你重视我！',
          '没什么需要，无所谓了。'
        ],
        ideal_response_type: 'need',
        scoring: { communication: 10, expression: 15, empathy: 15, emotion_control: 10, adaptability: 10 }
      },
      {
        round: 5,
        situation: '朋友认真地点了点头。进入NVC第四步"请求"。',
        coach_hint: '提出具体、正向、可执行的请求，而不是命令，给对方选择的空间',
        options: [
          '下次如果会迟到，能提前10分钟告诉我吗？这样我可以安排好时间。',
          '你以后绝对不能再迟到了！',
          '随便吧，你爱怎样怎样。'
        ],
        ideal_response_type: 'request',
        scoring: { communication: 15, expression: 10, empathy: 15, emotion_control: 10, adaptability: 10 }
      }
    ]
  },
  {
    id: 'scene_comfort_friend',
    name: '安慰TA',
    stage: '熟悉期',
    difficulty: 'easy',
    description: '朋友遇到困难来找你倾诉，练习如何正确地安慰和陪伴',
    total_rounds: 5,
    unlock_condition: { min_points: 50, min_level: 'bronze' },
    teaching_points: ['倾听不打断', '共情回应', '避免建议', '陪伴支持', '适度表达关心'],
    npc_name: '烦恼的朋友',
    npc_avatar: '/assets/npc/sad_friend.png',
    opening: '你的好朋友发消息说想找你聊聊，语气很低落。你们见面后，TA看起来很疲惫。',
    rounds: [
      {
        round: 1,
        situation: '朋友坐下后沉默了一会儿，然后说："我今天被领导骂了..."',
        coach_hint: '给予空间，不急着追问细节，用简单回应让对方知道你在听',
        options: [
          '嗯，我在听。想说说的话随时说。',
          '怎么回事？快跟我说说具体发生了什么！',
          '别难过了，没什么大不了的。'
        ],
        ideal_response_type: 'active_listening',
        scoring: { communication: 10, expression: 5, empathy: 20, emotion_control: 10, adaptability: 5 }
      },
      {
        round: 2,
        situation: '朋友越说越激动："我真的已经尽力了，为什么还是不行！"',
        coach_hint: '先共情情绪，认可对方的感受，不要急着给建议或分析问题',
        options: [
          '听起来你真的很委屈，已经很努力了还被这样对待，换谁都会难受的。',
          '你先冷静一下，别这么激动。',
          '我觉得你可以这样想，领导可能也不是针对你...'
        ],
        ideal_response_type: 'empathy',
        scoring: { communication: 10, expression: 10, empathy: 25, emotion_control: 5, adaptability: 5 }
      },
      {
        round: 3,
        situation: '朋友说："我是不是真的很差劲？"',
        coach_hint: '不要说"你不差"，而是承认TA此刻的自我怀疑感，用事实温和回应',
        options: [
          '你现在的感受我能理解。但在我眼里，你一直在很认真地对待工作，这不是差劲的表现。',
          '当然不是！你想太多了！别这么想！',
          '其实你可以换一个角度来看这个问题...'
        ],
        ideal_response_type: 'validate_feeling',
        scoring: { communication: 10, expression: 10, empathy: 20, emotion_control: 10, adaptability: 10 }
      },
      {
        round: 4,
        situation: '朋友稍微平静了一些，问："你觉得我该怎么办？"',
        coach_hint: '对方主动求助时可以分享想法，但用"你有没有考虑过..."而非"你应该..."，保留对方的自主权',
        options: [
          '你有没有考虑过跟领导单独聊聊你的想法？不过这是你自己的节奏，不着急做决定。',
          '你应该直接找领导谈！不争取怎么行！',
          '我也不知道...你自己看着办吧。'
        ],
        ideal_response_type: 'gentle_suggestion',
        scoring: { communication: 10, expression: 10, empathy: 15, emotion_control: 10, adaptability: 15 }
      },
      {
        round: 5,
        situation: '朋友起身准备离开，说："谢谢你听我说这些。"',
        coach_hint: '温暖收尾，让对方感受到你随时都在，但不过度承诺',
        options: [
          '随时都可以找我。今天辛苦了，回去好好休息。',
          '小事一桩！以后有事尽管来！',
          '嗯。（沉默点头）'
        ],
        ideal_response_type: 'warm_closing',
        scoring: { communication: 10, expression: 10, empathy: 15, emotion_control: 10, adaptability: 15 }
      }
    ]
  },
  {
    id: 'scene_upward_report',
    name: '向上汇报',
    stage: '职场期',
    difficulty: 'hard',
    description: '向领导做一次结构化的工作汇报，展示成果并应对追问',
    total_rounds: 5,
    unlock_condition: { min_points: 150, min_level: 'gold' },
    teaching_points: ['结构化表达', '数据支撑', '应对追问', '控制节奏', '总结建议'],
    npc_name: '部门领导',
    npc_avatar: '/assets/npc/boss.png',
    opening: '你需要向领导汇报本季度项目进展。领导时间有限，希望你简明扼要地说明情况。',
    rounds: [
      {
        round: 1,
        situation: '领导说："开始吧，简单说一下这个季度的进展。"',
        coach_hint: '用结论先行的方式开场，先说核心结论再展开，控制在一分钟内概述全貌',
        options: [
          '本季度项目整体完成率85%。核心指标：用户增长30%，营收增长18%，有两项风险需要汇报。',
          '好的，我从头说起，首先我们开了一个启动会，然后做了调研，接着...',
          '总体还行吧，大家都很努力，虽然有些小问题但基本都能搞定。'
        ],
        ideal_response_type: 'conclusion_first',
        scoring: { communication: 20, expression: 15, empathy: 5, emotion_control: 5, adaptability: 5 }
      },
      {
        round: 2,
        situation: '你开始展开核心数据，领导微微点头示意继续。',
        coach_hint: '数据支撑观点，关键数字要精准，用对比突出成果（同比/环比/目标对比）',
        options: [
          '用户增长方面，新增用户1.2万，环比增长30%，超出目标5个百分点。主要来自渠道A的优化，转化率从8%提升到12%。',
          '用户增长了很多，比上个季度好多了，大家反馈都不错。',
          '数据我做了个表，回头发您邮箱看吧。'
        ],
        ideal_response_type: 'data_driven',
        scoring: { communication: 15, expression: 20, empathy: 5, emotion_control: 5, adaptability: 5 }
      },
      {
        round: 3,
        situation: '领导突然追问："营收增长为什么没跟上用户增长？"',
        coach_hint: '面对追问不要慌，先承认事实，再用数据和原因分析回应，展现你的思考深度',
        options: [
          '这是个好问题。营收增速确实低于用户增速，主要原因是新用户付费转化周期较长。数据显示第3个月转化率才趋于稳定，预计下季度营收增速会追上来。',
          '呃...可能是新用户消费能力还不太够吧...',
          '这个我也不是很确定，我回去再查查。'
        ],
        ideal_response_type: 'handle_challenge',
        scoring: { communication: 10, expression: 10, empathy: 5, emotion_control: 20, adaptability: 15 }
      },
      {
        round: 4,
        situation: '领导继续追问："那两项风险具体是什么？你打算怎么处理？"',
        coach_hint: '风险要诚实报告，同时给出已思考的应对方案，体现主动性和责任感',
        options: [
          '第一项风险是渠道B成本上升20%，我计划本月启动渠道C的测试。第二项是核心成员即将产假，已安排交接并提前招募了替补人选。',
          '风险就是...有些事可能不太顺利，我们正在想办法。',
          '其实也没什么大风险，不用太担心。'
        ],
        ideal_response_type: 'risk_transparency',
        scoring: { communication: 10, expression: 15, empathy: 5, emotion_control: 15, adaptability: 15 }
      },
      {
        round: 5,
        situation: '领导说："好的，最后总结一下你的建议。"',
        coach_hint: '用简洁的1-2-3点总结，最后以明确的下一步行动收尾，让领导做决策',
        options: [
          '建议三点：一，继续加大渠道A投入；二，本月启动渠道C测试；三，Q2目标调整营收增速至25%。如果同意，我明天出详细方案。',
          '总之继续努力，争取下个季度更好！',
          '领导您看还需要我做什么？我听您安排。'
        ],
        ideal_response_type: 'summary_with_action',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 10, adaptability: 15 }
      }
    ]
  }
];
