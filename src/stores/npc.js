import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNpcStore = defineStore('npc', () => {
  const npcs = ref({
    'xiaobai': {
      id: 'xiaobai',
      name: '小白',
      tags: ['可爱', '迷糊'],
      description: '银灰发红瞳的可爱少女，总是戴着兔耳兜帽。性格天真烂漫，有点小迷糊。',
      image: 'npc_white_thigh_v18_transparent.png',
      portrait: 'npc_white_thigh_v18_transparent.png',
      avatar: 'npc_xiaobai_avatar.png',
      heart: 0,
      maxHeart: 30,
      favCrop: 'crop_turnip',
      favDish: 'dish_tomato_radish'  // 茄汁萝卜
    },
    'xiaolv': {
      id: 'xiaolv',
      name: '小绿',
      tags: ['清新', '治愈'],
      description: '棕发绿眼的森系少女，身穿米白吊带裙。温柔体贴，是村里的治愈担当。',
      image: 'npc_xiaolv_portrait_new.png',
      portrait: 'npc_xiaolv_portrait_new.png',
      avatar: 'npc_xiaolv_avatar.png',
      heart: 0,
      maxHeart: 30,
      favCrop: 'crop_potato',
      favDish: 'dish_potato_shreds'  // 酸甜土豆丝
    },
    'xiaoguang': {
      id: 'xiaoguang',
      name: '小光',
      tags: ['治愈', '温暖'],
      description: '橘发蓝眼的治愈系少年。虽然以前很热血，现在变得更加平和稳重了。',
      image: 'npc_xiaoguang_portrait_new.png',
      portrait: 'npc_xiaoguang_portrait_new.png',
      avatar: 'npc_xiaoguang_avatar.png',
      heart: 0,
      maxHeart: 30,
      favCrop: 'crop_corn',
      favDish: 'dish_chili_corn'  // 红油玉米
    },
    'xiaoying': {
      id: 'xiaoying',
      name: '小影',
      tags: ['文静', '细腻'],
      description: '黑发黑眼的文静少年，喜欢读书。平时沉默寡言，内心却很细腻。',
      image: 'npc_shadow_thigh_v7_transparent_transparent.png',
      portrait: 'npc_shadow_thigh_v7_transparent_transparent.png',
      avatar: 'npc_xiaoying_avatar.png',
      heart: 0,
      maxHeart: 30,
      favCrop: 'crop_pumpkin',
      favDish: 'dish_pumpkin_paste'  // 甜甜南瓜泥
    }
  })

  // Populating NPC Events to fix the "No Reaction" bug in ProfileView
  // These events complement the main story "Time Capsule" arc.
  const npcEvents = {
      'xiaobai': {
          10: {
              title: "梦中的宝物",
              dialogue: [
                  { speaker: "小白", text: "呐呐！我昨晚又做了一个奇怪的梦！" },
                  { speaker: "我", text: "又是关于那个宝藏的梦吗？" },
                  { speaker: "小白", text: "嗯...梦里大家都聚在一起，阳光好暖和，风吹过草地的声音沙沙的..." },
                  { speaker: "小白", text: "但是醒来后，心里空落落的。我不记得宝物埋在哪里了，只记得它对我们很重要。" },
                  { speaker: "小白", text: "那种感觉...就像是弄丢了什么很珍贵的东西，但我一定会把它找回来的！" }
              ]
          },
          20: {
              title: "闪闪发光的回忆",
              dialogue: [
                  { speaker: "小白", text: "哇——！真的是它！真的是我们的时光胶囊！" },
                  { speaker: "小白", text: "你看这个弹珠，虽然已经有点旧了，但在太阳下还是闪闪发光的！" },
                  { speaker: "小白", text: "我想起来了，那时候我总是赢走你们的弹珠，小光还因为这个哭过鼻子呢！" },
                  { speaker: "我", text: "那时候你可是这里的孩子王啊。" },
                  { speaker: "小白", text: "嘿嘿，那是当然！这些闪闪发光的东西，就是我们小时候的快乐啊，一点都没变！" }
              ]
          },
          30: {
              title: "庆典的约定",
              dialogue: [
                  { speaker: "小白", text: "要办庆典了吗？太棒了！我已经迫不及待了！" },
                  { speaker: "小白", text: "我要穿上我最喜欢的裙子，在篝火旁为大家跳舞！" },
                  { speaker: "小白", text: "就像梦里一样，大家围坐在一起，没有烦恼，只有欢笑。" },
                  { speaker: "小白", text: "呐，到时候你一定要看我跳舞哦！这是我们新的约定！" }
              ]
          }
      },
      'xiaolv': {
          10: {
              title: "温柔的直觉",
              dialogue: [
                  { speaker: "小绿", text: "最近小白总是望着天空发呆，嘴里念叨着那个梦。" },
                  { speaker: "我", text: "你也记得那个时光胶囊吗？" },
                  { speaker: "小绿", text: "当然记得。那是我们友谊的见证，是我们共同埋下的希望。" },
                  { speaker: "小绿", text: "我有一种预感，它就在那棵老橡树下，静静地等待着我们去唤醒它。" },
                  { speaker: "小绿", text: "如果能再次看到它，也许大家的心又能紧紧连在一起了。" }
              ]
          },
          20: {
              title: "时光的信笺",
              dialogue: [
                  { speaker: "小绿", text: "看着这封泛黄的信，眼泪差点掉下来了。" },
                  { speaker: "小绿", text: "“希望能一直在一起”...虽然字迹歪歪扭扭的，但那份稚嫩的心意，现在读来依然滚烫。" },
                  { speaker: "小绿", text: "这么多年过去了，大家各奔东西，但只要回到这里，感觉就像从未分开过。" },
                  { speaker: "我", text: "是啊，我们永远是最好的朋友。" },
                  { speaker: "小绿", text: "谢谢你，带我们找回了这份珍贵的初心。" }
              ]
          },
          30: {
              title: "绿色的希冀",
              dialogue: [
                  { speaker: "小绿", text: "为了这次庆典，我会去山上采最美的野花，把村子装扮得漂漂亮亮的。" },
                  { speaker: "小绿", text: "我想用鲜花编织一个个花环，送给每一位回到故乡的人。" },
                  { speaker: "小绿", text: "让大家闻到花香，就能想起小时候在田野里奔跑的日子。" },
                  { speaker: "小绿", text: "我们要创造更多美好的回忆，让这里永远充满生机和希望。" }
              ]
          }
      },
      'xiaoguang': {
          10: {
              title: "模糊的记忆",
              dialogue: [
                  { speaker: "小光", text: "时光胶囊？哈哈，我完全把这回事忘到九霄云外去了！" },
                  { speaker: "我", text: "你这家伙，记性还是这么差，除了吃就是玩。" },
                  { speaker: "小光", text: "谁说的！我记得那时候我们经常去河边抓鱼，弄得浑身是泥回来挨骂！" },
                  { speaker: "小光", text: "也许胶囊就埋在河边的秘密基地？那里可是藏宝贝的好地方！" },
                  { speaker: "小光", text: "不过要是真挖出来了，千万别有我小时候写的羞耻日记啊！" }
              ]
          },
          20: {
              title: "黑历史",
              dialogue: [
                  { speaker: "小光", text: "啊啊啊！别念了！别念了！求你了！" },
                  { speaker: "我", text: "“我要成为守护宇宙和平的第一大英雄”...哈哈哈，这语气真的很小光！" },
                  { speaker: "小光", text: "啰嗦！那时候电视里的英雄多帅啊，我也想那样嘛！" },
                  { speaker: "小光", text: "虽然现在没能拯救宇宙，但我可以守护这片土地，守护大家的笑容！" },
                  { speaker: "小光", text: "这也不赖，对吧？" }
              ]
          },
          30: {
              title: "大干一场",
              dialogue: [
                  { speaker: "小光", text: "既然决定要办庆典，那就不能随随便便！要做就做最热闹的！" },
                  { speaker: "小光", text: "搭建舞台这种体力活就包在我身上了！我有的是力气！" },
                  { speaker: "小光", text: "我会用最好的木头，搭一个最结实的舞台，让小白尽情跳舞！" },
                  { speaker: "我", text: "那就拜托你啦，未来的大英雄。" },
                  { speaker: "小光", text: "嘿嘿，看我的吧！绝对让大家大吃一惊！" }
              ]
          }
      },
      'xiaoying': {
          10: {
              title: "静默的线索",
              dialogue: [
                  { speaker: "小影", text: "......那个胶囊。" },
                  { speaker: "我", text: "怎么了？你是不是记得些什么？" },
                  { speaker: "小影", text: "嗯。那天夕阳很红，把影子拉得很长。我们就在那棵老树下。" },
                  { speaker: "小影", text: "大家的手上都沾满了泥土，但是笑得很开心。我记得那个画面。" },
                  { speaker: "小影", text: "它不在河边，也不在秘密基地。它一直在那里，替我们守着时间。" }
              ]
          },
          20: {
              title: "珍藏的画",
              dialogue: [
                  { speaker: "小影", text: "这幅画......是我那时候偷偷塞进去的。" },
                  { speaker: "我", text: "画的是大家一起坐在屋顶上看烟火的样子呢，画得真好。" },
                  { speaker: "小影", text: "那时候我就希望能一直这样下去，时间能停在那一刻就好了。" },
                  { speaker: "小影", text: "虽然大家变了样，但聚在一起的感觉，和画里一样。我的愿望实现了。" }
              ]
          },
          30: {
              title: "记录者",
              dialogue: [
                  { speaker: "小影", text: "庆典吗......你也知道，我不擅长那种热闹的场合。" },
                  { speaker: "我", text: "没关系，你可以用你的方式参与啊。" },
                  { speaker: "小影", text: "嗯。我会躲在角落里，用相机记录下每一个瞬间。" },
                  { speaker: "小影", text: "大家的笑脸，烟火的光芒，我想把它们都留下来。作为我们新的“宝物”。" }
              ]
          }
      }
  }

  function getEvent(npcId, level) {
      if (npcEvents[npcId] && npcEvents[npcId][level]) {
          return npcEvents[npcId][level]
      }
      return null
  }

  // State initialization
  function initNpc() {
    const oldSaved = localStorage.getItem('stardew-npc-save')
    if (oldSaved) {
      const data = JSON.parse(oldSaved)
      Object.keys(data).forEach(key => {
        if (npcs.value[key]) {
          npcs.value[key].heart = data[key].heart
        }
      })
    }
  }

  function saveNpc() {
    const data = {}
    Object.keys(npcs.value).forEach(key => {
      data[key] = { heart: npcs.value[key].heart }
    })
    localStorage.setItem('stardew-npc-save', JSON.stringify(data))
  }

  function increaseHeart(npcId, amount) {
    if (npcs.value[npcId]) {
      npcs.value[npcId].heart = Math.min(npcs.value[npcId].maxHeart, npcs.value[npcId].heart + amount)
      saveNpc()
      return npcs.value[npcId].heart
    }
    return 0
  }
  
  function setHeart(npcId, val) {
      if (npcs.value[npcId]) {
          npcs.value[npcId].heart = Math.min(npcs.value[npcId].maxHeart, Math.max(0, val))
          saveNpc()
      }
  }

  // Gift dish to NPC
  // quality: 'disaster' (-5), 'normal' (+5), 'delicious' (+10)
  // If dish is NPC's favorite, bonus x2
  function giftDish(npcId, dishId, quality) {
    const npc = npcs.value[npcId]
    if (!npc) return null
    
    let heartChange = 0
    let reaction = ''
    
    switch (quality) {
      case 'disaster':
        heartChange = -5
        reaction = getDisasterReaction(npcId)
        break
      case 'normal':
        heartChange = 5
        reaction = getNormalReaction(npcId)
        break
      case 'delicious':
        heartChange = 10
        reaction = getDeliciousReaction(npcId)
        break
    }
    
    // Double bonus if favorite dish
    const isFavorite = npc.favDish === dishId
    if (isFavorite && heartChange > 0) {
      heartChange *= 2
      reaction = getFavoriteReaction(npcId, quality)
    }
    
    // Apply heart change
    npc.heart = Math.max(0, Math.min(npc.maxHeart, npc.heart + heartChange))
    saveNpc()
    
    return { heartChange, reaction, isFavorite }
  }

  function getDisasterReaction(npcId) {
    const reactions = {
      'xiaobai': '呜...这个味道好奇怪...我肚子有点不舒服...',
      'xiaolv': '这个...呃...下次可以不用这么辛苦了...',
      'xiaoguang': '咳咳...这是什么黑暗料理啊！',
      'xiaoying': '......（默默放下筷子）'
    }
    return reactions[npcId] || '这个味道...有点微妙...'
  }

  function getNormalReaction(npcId) {
    const reactions = {
      'xiaobai': '谢谢你！味道还不错呢~',
      'xiaolv': '辛苦你了，我会好好品尝的。',
      'xiaoguang': '哦！看起来很好吃！谢啦！',
      'xiaoying': '......谢谢。（轻轻点头）'
    }
    return reactions[npcId] || '谢谢你的心意。'
  }

  function getDeliciousReaction(npcId) {
    const reactions = {
      'xiaobai': '哇！好好吃！你怎么这么厉害！',
      'xiaolv': '这味道...太棒了！你真的很有天赋呢。',
      'xiaoguang': '绝了！这是我吃过最好吃的！',
      'xiaoying': '......（眼睛发亮）这个...真的很美味。'
    }
    return reactions[npcId] || '太美味了！'
  }

  function getFavoriteReaction(npcId, quality) {
    const reactions = {
      'xiaobai': '这是我最喜欢的茄汁萝卜！你还记得！太开心了！',
      'xiaolv': '酸甜土豆丝...你怎么知道我喜欢这个？好感动...',
      'xiaoguang': '红油玉米！我的最爱！你太懂我了！',
      'xiaoying': '甜甜南瓜泥...（脸微红）你...记得我喜欢这个？'
    }
    return reactions[npcId] || '这是我最喜欢的！谢谢你！'
  }

  return {
    npcs,
    initNpc,
    increaseHeart,
    getEvent,
    setHeart,
    giftDish
  }
})
