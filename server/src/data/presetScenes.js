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
  },
  // ========== Phase 4: 高难期 ==========
  {
    id: 'scene_salary_approved',
    name: '加薪谈判-认可型老板',
    stage: '高难期',
    difficulty: 'hard',
    description: '面对已经认可你的能力、但以预算为由推脱的老板，如何突破他的借口争取加薪',
    total_rounds: 5,
    unlock_condition: { min_points: 300, min_level: 'gold' },
    teaching_points: ['准备加薪理由', '开场表达', '应对预算借口', '提出替代方案', '达成共识'],
    npc_name: '认可型老板',
    npc_avatar: '/assets/npc/boss_approved.png',
    opening: '你在公司表现优异，老板也多次肯定你的能力。今天你决定正式提出加薪，推开老板办公室的门...',
    rounds: [
      {
        round: 1,
        situation: '你走进老板办公室，老板正在看文件。你需要开启加薪话题。',
        coach_hint: '先表达对公司和团队认可，再自然引入加薪诉求，不要一上来就谈钱',
        options: [
          '领导您好，我在公司两年了，非常感谢您的认可。今天想跟您聊聊我的薪资调整。',
          '领导，我觉得我工资太低了，必须给我加薪。',
          '领导，那个...嗯...我就是来看看您忙不忙...'
        ],
        ideal_response_type: 'appreciation_lead',
        scoring: { communication: 15, expression: 15, empathy: 10, emotion_control: 15, adaptability: 5 }
      },
      {
        round: 2,
        situation: '老板说："小X啊，你的能力我是认可的。但你也知道，今年预算确实紧张..."',
        coach_hint: '先认同对方的难处，再用数据支撑你的价值，不被"认可"冲昏头脑而忽略实质诉求',
        options: [
          '理解您的考虑。不过我这半年独立完成了3个核心项目，为部门带来了30%的业绩增长，我想这个贡献值得对应的薪资回报。',
          '您都说认可我了，那就应该给我加薪啊！',
          '那算了，我理解公司困难。（放弃）'
        ],
        ideal_response_type: 'data_supported',
        scoring: { communication: 15, expression: 15, empathy: 10, emotion_control: 10, adaptability: 10 }
      },
      {
        round: 3,
        situation: '老板说："你说的我都知道，但预算真的卡得很死，我也没办法。"',
        coach_hint: '不要被"没办法"堵死，把问题从"能不能"转向"怎么才能"，提出替代方案',
        options: [
          '如果一次性调薪有困难，我们能不能分阶段调整？比如先调一部分，下季度再补齐？或者通过项目奖金的方式体现？',
          '那您说什么时候能加？总得给个时间吧！',
          '好吧，那等预算宽松了再说吧。'
        ],
        ideal_response_type: 'alternative_proposal',
        scoring: { communication: 15, expression: 10, empathy: 15, emotion_control: 15, adaptability: 15 }
      },
      {
        round: 4,
        situation: '老板说："分阶段调可以考虑，但幅度不能太大。你期望多少？"',
        coach_hint: '给出高于预期的数字作为锚点，同时表达灵活空间，不要先亮底牌',
        options: [
          '基于市场行情和我的贡献，我期望调整到X。当然我也理解公司的节奏，如果这个数字有压力，我们可以商量具体方案。',
          '起码加30%！少了我肯定不干。',
          '您觉得多少合适？我听您的。'
        ],
        ideal_response_type: 'anchored_negotiation',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 5,
        situation: '老板说："我回去跟HR商量一下，下周给你回复。"你需要锁定承诺。',
        coach_hint: '友好但坚定地确认时间节点和预期，避免"回去商量"变成无限期拖延',
        options: [
          '好的，感谢领导支持。那我们约下周三下午确认结果可以吗？如果还有需要我补充的材料，随时告诉我。',
          '行，等您消息。（没有跟进）',
          '下周？能不能这周就定？我不想等太久。'
        ],
        ideal_response_type: 'commitment_lock',
        scoring: { communication: 10, expression: 15, empathy: 10, emotion_control: 15, adaptability: 10 }
      }
    ]
  },
  {
    id: 'scene_salary_skeptical',
    name: '加薪谈判-质疑型老板',
    stage: '高难期',
    difficulty: 'hard',
    description: '面对你的加薪要求，老板质疑你的贡献和价值',
    total_rounds: 5,
    unlock_condition: { min_points: 300, min_level: 'gold' },
    teaching_points: ['陈述加薪请求', '应对质疑', '展示数据', '处理打压', '最终结果'],
    npc_name: '质疑型老板',
    npc_avatar: '/assets/npc/boss_skeptical.png',
    opening: '你向老板提出加薪，对方面无表情地靠在椅背上，用审视的目光看着你...',
    rounds: [
      {
        round: 1,
        situation: '你提出加薪后，老板冷冷地说："你觉得你值更多？凭什么？"',
        coach_hint: '不要被对方的语气激怒，冷静地用事实回应，把"凭什么"变成展示价值的机会',
        options: [
          '我理解您想看到依据。过去一年我主导了X项目，客户满意度提升了20%，团队效率也提高了15%。这些都是可量化的成果。',
          '我工作很努力啊，经常加班，凭什么是应该的！',
          '呃...我觉得我做得还行吧...'
        ],
        ideal_response_type: 'fact_based_response',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 20, adaptability: 5 }
      },
      {
        round: 2,
        situation: '老板皱眉说："那是团队的功劳，不能全算你头上。"',
        coach_hint: '承认团队贡献的同时，清晰地界定你个人的独特价值和不可替代性',
        options: [
          '确实是团队共同努力的结果。但其中核心方案是我提出的，关键节点也是我推动解决的。团队其他同事也有贡献，但我的角色是无可替代的。',
          '你说得对，是我们团队一起做的...',
          '没有我那个项目根本做不成！'
        ],
        ideal_response_type: 'differentiated_value',
        scoring: { communication: 15, expression: 15, empathy: 10, emotion_control: 15, adaptability: 5 }
      },
      {
        round: 3,
        situation: '老板翻了翻你的绩效表："你上季度KPI只完成了85%，这怎么说？"',
        coach_hint: '直面短板不回避，解释背景原因，同时展示你在其他维度的超预期表现',
        options: [
          '上季度KPI确实未达满分，主要因为临时接手了Y项目的救火任务，影响了原定指标。但如果看整体产出，Y项目挽回的损失远超KPI缺口。我可以展示详细对比数据。',
          '那个KPI设定本来就不合理！',
          '嗯...是，我确实没完成...'
        ],
        ideal_response_type: 'context_with_data',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 4,
        situation: '老板语气缓和了一点，但说："就算你说的都对，现在不是谈这个的时候。"',
        coach_hint: '识别对方态度松动，不要因"不是时候"而放弃，转化为明确时间承诺',
        options: [
          '我理解时机的重要性。那您觉得什么时候比较合适讨论这个？能否给我一个大致的时间节点，我好提前准备材料？',
          '什么时候都不是好时候！到底行不行给个痛快话！',
          '好吧，那等您觉得合适的时候再说。'
        ],
        ideal_response_type: 'timeline_request',
        scoring: { communication: 15, expression: 10, empathy: 10, emotion_control: 20, adaptability: 5 }
      },
      {
        round: 5,
        situation: '老板说："先做好你手头的事吧，其他的以后再说。"你需要做最后争取。',
        coach_hint: '不卑不亢地重申诉求，用专业态度留下印象，为后续跟进埋下伏笔',
        options: [
          '我会继续全力以赴做好工作。同时我也希望我的贡献能得到合理的回报，这是我的职业底线。我会在月底再次跟您沟通此事，谢谢您的时间。',
          '您就是不想给我加薪！（情绪失控）',
          '好的好的，我一定好好工作！（完全退让）'
        ],
        ideal_response_type: 'firm_closing',
        scoring: { communication: 10, expression: 15, empathy: 5, emotion_control: 20, adaptability: 10 }
      }
    ]
  },
  {
    id: 'scene_salary_promises',
    name: '加薪谈判-画饼型老板',
    stage: '高难期',
    difficulty: 'hard',
    description: '老板用未来承诺和画饼来回避当前加薪',
    total_rounds: 5,
    unlock_condition: { min_points: 300, min_level: 'gold' },
    teaching_points: ['提出加薪', '识别画饼', '坚持立场', '要求具体承诺', '设定时间线'],
    npc_name: '画饼型老板',
    npc_avatar: '/assets/npc/boss_promises.png',
    opening: '你向老板提出加薪，老板热情地说："好好好，你放心，我心里有数！"',
    rounds: [
      {
        round: 1,
        situation: '你提出加薪，老板笑着说："你放心，公司不会亏待你的，我一直在关注你。"',
        coach_hint: '识别模糊承诺，不要被热情态度蒙蔽，礼貌地把模糊承诺变成具体讨论',
        options: [
          '谢谢领导的认可，我很感激。不过我想具体聊聊薪资调整的方案，这样我也能更有方向地努力。',
          '谢谢领导！那我就放心了！（满足于模糊承诺）',
          '您说的关注具体是什么意思？'
        ],
        ideal_response_type: 'specific_discussion',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 2,
        situation: '老板说："等下半年公司上市了，肯定给你大幅调整！你好好干，到时候一起分蛋糕。"',
        coach_hint: '识别"画饼"模式——用未来不确定的大好处换取你当下放弃小诉求，用追问拆解模糊承诺',
        options: [
          '公司上市确实是好事。不过我更关心的是目前的薪资是否和我的贡献匹配。上市前这段时间，能否先做一个合理的过渡调整？',
          '上市了真的会加薪吗？太好了！（轻信画饼）',
          '又是画饼，我听太多了。（直接对抗）'
        ],
        ideal_response_type: 'recognize_vague_promise',
        scoring: { communication: 15, expression: 10, empathy: 10, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 3,
        situation: '老板说："你看小张，也是先做事后回报的嘛。年轻人不要太计较眼前。"',
        coach_hint: '不要被比较绑架，温和但坚定地表示"做事"和"合理回报"不矛盾',
        options: [
          '做事我一直在做，而且成果您也看到了。合理回报和计较眼前是两回事，我希望的是对我的付出给予当下的认可，这样我更有动力继续贡献。',
          '小张是小张，我是我！（情绪化比较）',
          '您说得对，我不应该计较...（自我否定）'
        ],
        ideal_response_type: 'decouple_effort_reward',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 20, adaptability: 5 }
      },
      {
        round: 4,
        situation: '老板说："行行行，我答应你，年底一定给你调。"但之前类似的承诺从未兑现。',
        coach_hint: '对重复承诺保持警惕，要求具体、书面化的承诺，而非口头"一定"',
        options: [
          '感谢您的承诺。为了让双方都有清晰的预期，能否把调整时间、幅度和考核标准确认一下？邮件确认也可以，这样我也能安心投入工作。',
          '您说的年底是具体什么时候？（开始追问但不够具体）',
          '好的，谢谢领导！（再次轻信）'
        ],
        ideal_response_type: 'request_specific_commitment',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 5,
        situation: '老板有些不耐烦了："你是不是不信任我？我说了给你调就一定会调。"',
        coach_hint: '把"不信任"的帽子甩回去，用专业框架重新定义对话——这不是信任问题，是流程问题',
        options: [
          '这不是信任的问题，是职业规范。任何薪资调整走正式流程对双方都是保障。我们就定一个明确的时间节点，到时候无论结果如何，至少沟通是透明的。',
          '我就是不信任你！（激化矛盾）',
          '对不起，是我多想了...（退缩）'
        ],
        ideal_response_type: 'reframe_professional',
        scoring: { communication: 10, expression: 15, empathy: 10, emotion_control: 20, adaptability: 5 }
      }
    ]
  },
  {
    id: 'scene_complaint_property',
    name: '投诉物业',
    stage: '高难期',
    difficulty: 'hard',
    description: '小区物业长期不作为，需要有效投诉',
    total_rounds: 5,
    unlock_condition: { min_points: 200, min_level: 'gold' },
    teaching_points: ['整理问题', '选择投诉渠道', '表达诉求', '应对推诿', '升级处理'],
    npc_name: '物业经理',
    npc_avatar: '/assets/npc/property_manager.png',
    opening: '你小区的电梯已坏了两周、公共区域卫生差、安保形同虚设。多次口头反映无果，今天你决定正式投诉...',
    rounds: [
      {
        round: 1,
        situation: '你来到物业办公室，需要系统地反映问题。',
        coach_hint: '先整理好问题清单，按轻重缓急排列，用事实和时间线说话，避免情绪化宣泄',
        options: [
          '我整理了三个主要问题：第一，A栋电梯已坏14天未修；第二，公共区域近一个月未正常清洁；第三，门禁系统失灵导致外来人员随意进出。这些都有记录和照片为证。',
          '你们物业怎么回事！什么都不干！我要投诉你们！',
          '那个...电梯好像坏了挺久了...卫生也不太好...'
        ],
        ideal_response_type: 'structured_complaint',
        scoring: { communication: 20, expression: 15, empathy: 5, emotion_control: 10, adaptability: 5 }
      },
      {
        round: 2,
        situation: '物业经理说："这些问题我们会处理的，你先回去等消息吧。"',
        coach_hint: '不要接受模糊回应，要求明确的处理时限和责任人',
        options: [
          '我理解处理需要时间，但之前多次反映都没有下文。这次我希望确定：每个问题的处理时限、具体负责人、以及给我书面回复的日期。比如电梯问题，本周五之前能修好吗？',
          '好吧，那等你们消息...（再次被敷衍）',
          '你们就是拖延！我不走，今天必须给我解决！（情绪化）'
        ],
        ideal_response_type: 'demand_timeline',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 3,
        situation: '物业经理说："电梯问题要等厂家来修，厂家排不上我们也没办法。"',
        coach_hint: '识别推诿话术，要求对方给出备选方案和临时措施，不接受"没办法"作为终点',
        options: [
          '厂家排期我理解，但两周了还没有确切时间说不过去。我的诉求是：一，今天内联系厂家确定维修日期并书面告知业主；二，在此期间安排临时保障措施，比如楼层巡查和安全提示。',
          '那你们就一直等？业主的安全谁负责？',
          '好吧，等厂家吧...（被动接受）'
        ],
        ideal_response_type: 'counter_excuse',
        scoring: { communication: 15, expression: 10, empathy: 10, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 4,
        situation: '物业经理开始推脱："这些事不归我管，你得找工程部。"',
        coach_hint: '不接受踢皮球，在当前对话中锁定责任人，要求对方内部协调而非让你转投',
        options: [
          '您作为物业经理，协调各部门解决问题是您的职责。我不需要去找工程部，我需要您作为对接人统筹处理这三个问题。如果今天不能给出解决方案，我将向住建局和业委会正式投诉。',
          '好吧，那我去找工程部。（被踢皮球）',
          '你就是推卸责任！（指责无实质推进）'
        ],
        ideal_response_type: 'pin_responsibility',
        scoring: { communication: 15, expression: 10, empathy: 5, emotion_control: 20, adaptability: 10 }
      },
      {
        round: 5,
        situation: '物业经理说："你投诉也没用，别把事情搞大了。"',
        coach_hint: '不被威胁吓退，清晰表明升级路径和对方不处理的后果，合理运用投诉渠道',
        options: [
          '我不希望事情升级，但如果物业不能在合理时间内解决问题，我会依法行使业主权利：一，向12345市民热线投诉；二，向住建局物业科反映；三，在业主大会提议更换物业。希望我们能合作解决问题。',
          '你威胁我？我就要搞大！（对抗升级）',
          '算了算了，不投诉了...（退缩）'
        ],
        ideal_response_type: 'legitimate_escalation',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 15, adaptability: 10 }
      }
    ]
  },
  {
    id: 'scene_negotiate_4s',
    name: '4S店砍价',
    stage: '高难期',
    difficulty: 'hard',
    description: '在4S店购车时与销售砍价',
    total_rounds: 5,
    unlock_condition: { min_points: 200, min_level: 'gold' },
    teaching_points: ['了解底价', '初始报价', '应对话术', '利用竞争', '最终成交'],
    npc_name: '4S店销售',
    npc_avatar: '/assets/npc/sales_4s.png',
    opening: '你看中了一款车，指导价15万。走进4S店，销售热情地迎上来...',
    rounds: [
      {
        round: 1,
        situation: '销售说："这款车现在优惠力度很大，给您报个价？"你需要获取信息。',
        coach_hint: '先听对方报价，不要先亮底牌，同时了解当前市场行情和优惠政策',
        options: [
          '好，您先说说现在的优惠方案，裸车价多少？有什么附加条件吗？我之前也了解了其他店的报价。',
          '14万行不行？我直接定了！',
          '嗯...你看着报吧...'
        ],
        ideal_response_type: 'information_gathering',
        scoring: { communication: 15, expression: 10, empathy: 5, emotion_control: 15, adaptability: 15 }
      },
      {
        round: 2,
        situation: '销售报价："裸车14万2，送脚垫和贴膜，这已经是最低价了。"',
        coach_hint: '不相信"最低价"，用自己的心理价位建立锚点，同时要求明细报价',
        options: [
          '14万2还是偏高了，我的预期在13万5左右。另外能否给我一份明细报价？包括裸车、购置税、保险、上牌费，我需要看总价。',
          '能不能再便宜点？',
          '行吧，14万2就14万2...（轻易接受）'
        ],
        ideal_response_type: 'anchor_and_detail',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 10, adaptability: 15 }
      },
      {
        round: 3,
        situation: '销售说："这个价格我们真的做不下来，亏本的。要不您看看低配版？"',
        coach_hint: '识别销售压价话术——"亏本"和"看低配"都是让你降低预期的策略，坚持车型但调整谈判策略',
        options: [
          '我就是要这款配置，低配不考虑。价格方面我们慢慢谈，您先去请示一下经理，看看还能不能有空间。我这边今天就能定，前提是价格到位。',
          '低配也行吧，便宜就好...（被引导降档）',
          '不卖拉倒，我去别家！（掀桌走人）'
        ],
        ideal_response_type: 'hold_ground_leverage',
        scoring: { communication: 15, expression: 10, empathy: 5, emotion_control: 20, adaptability: 10 }
      },
      {
        round: 4,
        situation: '销售请示回来："经理说最低13万8，但是要贷款3年才行。"',
        coach_hint: '分析附加条件的真实成本，贷款利息可能抵消降价，用竞品或竞店施压',
        options: [
          '我倾向全款购车，贷款的话利息算下来并不划算。另外我了解到隔壁XX店同配置给到了13万6，还送保养。如果你们能13万6全款，我今天就能签约。',
          '13万8也行，贷款就贷款吧...（未算清成本）',
          '必须全款！13万5以下！一分不能多！（僵化立场）'
        ],
        ideal_response_type: 'competition_leverage',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 5,
        situation: '销售说："13万7，全款，送3次保养和脚垫贴膜，这真的是底线了。"',
        coach_hint: '评估最后报价是否合理，决定接受还是做最后一搏，不要因为疲惫而妥协',
        options: [
          '13万7可以考虑，但保养再加两次，一共5次，我现在就付定金。如果不行，我再回去考虑一下，明天给您回复。',
          '不行！必须13万6！（错过合理成交）',
          '好的好的，13万7成交！什么都不要了！（过度退让）'
        ],
        ideal_response_type: 'final_negotiation',
        scoring: { communication: 10, expression: 15, empathy: 5, emotion_control: 15, adaptability: 15 }
      }
    ]
  },
  {
    id: 'scene_negotiate_street',
    name: '路边摊砍价',
    stage: '高难期',
    difficulty: 'hard',
    description: '在路边摊/菜市场砍价',
    total_rounds: 5,
    unlock_condition: { min_points: 150, min_level: 'silver' },
    teaching_points: ['了解行情', '开局砍价', '应对加价', '巧妙施压', '成交收尾'],
    npc_name: '摊主阿姨',
    npc_avatar: '/assets/npc/vendor_aunt.png',
    opening: '你在菜市场看到一个摊位卖水果，标价8块一斤。你想买几斤，但觉得价格偏贵...',
    rounds: [
      {
        round: 1,
        situation: '摊主阿姨招呼你："来看看，新鲜的水果！"你需要先了解行情。',
        coach_hint: '先观察品质和数量，用闲聊了解价格空间，不要上来就砍',
        options: [
          '阿姨，这水果看着不错，怎么卖？8块一斤？旁边那家好像6块，您这是什么品种？',
          '8块？5块行不行？',
          '嗯...挺贵的...（犹豫不决）'
        ],
        ideal_response_type: 'casual_inquiry',
        scoring: { communication: 15, expression: 10, empathy: 10, emotion_control: 10, adaptability: 15 }
      },
      {
        round: 2,
        situation: '阿姨说："我这是正宗的，跟那些不一样的！你要多少？"',
        coach_hint: '用购买量做筹码，表明你要多买来换取优惠',
        options: [
          '我想要3斤，您给个实惠价呗。要是价格合适我以后常来，也可以介绍邻居来买。',
          '就买1斤，便宜点吧。',
          '好吧，8块就8块...（直接接受）'
        ],
        ideal_response_type: 'volume_leverage',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 10, adaptability: 15 }
      },
      {
        round: 3,
        situation: '阿姨说："3斤的话，7块5一斤吧，已经很便宜了！"',
        coach_hint: '不要对第一次让步满意，用合理的理由继续压价',
        options: [
          '阿姨，7块5还是贵了，6块5一斤怎么样？3斤就是19块5，我微信直接转您，也省得您找零。',
          '7块5可以！（满足于小让步）',
          '必须5块！少一分不买！（砍价过度）'
        ],
        ideal_response_type: 'reasonable_counter',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 4,
        situation: '阿姨有些不乐意："6块5我亏本的！这样吧，7块，不能再少了。"',
        coach_hint: '用"走人"策略温和施压，同时给对方台阶，不把路堵死',
        options: [
          '那这样，我再去前面转转比较一下，如果还是您家最实惠我再回来。要不就7块，再送我几个小的？',
          '行吧行吧，7块就7块...（轻易妥协）',
         '6块5！不卖我走了！（僵持不放）'
        ],
        ideal_response_type: 'walkaway_leverage',
        scoring: { communication: 15, expression: 10, empathy: 10, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 5,
        situation: '阿姨犹豫了一下说："那行吧，7块一斤再送你两个。你是个会说话的。"',
        coach_hint: '成交时确认细节，保持友好关系，为下次交易留好印象',
        options: [
          '谢谢阿姨！以后买水果就认准您家了。您帮我挑几个好的呗，下次我带朋友来。',
          '才送两个？再多点！（得寸进尺）',
          '嗯，谢谢...（草草收场）'
        ],
        ideal_response_type: 'friendly_close',
        scoring: { communication: 10, expression: 15, empathy: 15, emotion_control: 10, adaptability: 10 }
      }
    ]
  },
  {
    id: 'scene_complaint_customer_service',
    name: '投诉客服',
    stage: '高难期',
    difficulty: 'hard',
    description: '商品出了问题，需要有效投诉客服',
    total_rounds: 5,
    unlock_condition: { min_points: 200, min_level: 'gold' },
    teaching_points: ['描述问题', '表达不满', '要求解决方案', '应对拖延', '升级投诉'],
    npc_name: '客服专员',
    npc_avatar: '/assets/npc/customer_service.png',
    opening: '你网购的商品到手发现质量有问题，联系客服处理。等了20分钟终于接通了...',
    rounds: [
      {
        round: 1,
        situation: '客服说："您好，请问有什么可以帮您？"你需要描述问题。',
        coach_hint: '简明扼要地说明问题，包含订单号、问题描述、你的诉求，不要长篇大论',
        options: [
          '我5号下单的订单（订单号XXXX），收到的商品有明显质量问题：外壳破裂、功能无法使用。我的诉求是退货退款，请尽快处理。',
          '你们卖的东西是假的！垃圾！骗人的！',
          '嗯...就是我买的东西有点问题...不太好用...'
        ],
        ideal_response_type: 'clear_problem_statement',
        scoring: { communication: 20, expression: 15, empathy: 5, emotion_control: 10, adaptability: 5 }
      },
      {
        round: 2,
        situation: '客服说："非常抱歉给您带来不便，我帮您记录一下。请问有照片吗？"',
        coach_hint: '提前准备好证据，配合对方流程但设定时限，不要无休止地等',
        options: [
          '照片和视频我都拍了，现在可以发给您。不过我想确认一下：资料提交后多长时间能给出处理结果？我不希望一直等。',
          '照片？我回头再拍吧。（未准备证据）',
          '我都发了！你们就是不处理！我太生气了！（只有情绪没有实质）'
        ],
        ideal_response_type: 'evidence_with_deadline',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 3,
        situation: '客服说："我帮您申请退货，但需要7-15个工作日审核。"',
        coach_hint: '不接受过长的处理周期，引用消费者权益法规压缩时限',
        options: [
          '7-15个工作日太长了。根据消费者权益保护法，7天无理由退货应在收到商品后7天内处理。我要求在3个工作日内给出明确处理结果，否则我将向平台投诉并申请介入。',
          '好吧，那就等15天吧...（被动接受）',
          '15天？你们想拖到什么时候！骗子！（纯情绪发泄）'
        ],
        ideal_response_type: 'legal_leverage',
        scoring: { communication: 15, expression: 10, empathy: 5, emotion_control: 20, adaptability: 10 }
      },
      {
        round: 4,
        situation: '客服说："我帮您加急了，但还是需要5个工作日。这是流程，没办法跳过的。"',
        coach_hint: '识别"流程"借口，要求升级到有决定权的人，同时保留后续升级渠道',
        options: [
          '我理解您个人权限有限。能否帮我转接主管或投诉处理专员？如果5个工作日后仍未解决，我会同时向12315和平台发起正式投诉，届时处理成本会更高。',
          '好吧，5天就5天...（继续被动）',
          '你们就是不想处理！我要曝光你们！（空泛威胁）'
        ],
        ideal_response_type: 'escalate_authority',
        scoring: { communication: 15, expression: 15, empathy: 5, emotion_control: 15, adaptability: 10 }
      },
      {
        round: 5,
        situation: '主管接入了："您好，我是客服主管，了解了您的情况。我们加急处理，48小时内给您退款。"',
        coach_hint: '确认承诺并要求书面确认，确保不会被再次拖延',
        options: [
          '好的，感谢您的处理。我需要一个书面确认——短信或邮件通知退款进度和到账时间，这样双方都有记录。如果48小时内没有收到退款，我会再次跟进。',
          '好的，谢谢！（没有确认）',
         '48小时？现在就退！（过度施压）'
        ],
        ideal_response_type: 'confirm_with_record',
        scoring: { communication: 15, expression: 10, empathy: 10, emotion_control: 15, adaptability: 10 }
      }
    ]
  }
];
