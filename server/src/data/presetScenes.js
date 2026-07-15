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
  }
];
