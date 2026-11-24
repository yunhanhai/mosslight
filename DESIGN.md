---
name: "苔光守夜 Mosslight"
description: "实时苔床、手写题字与克制控件构成的夜间花园生存游戏。"
colors:
  page: "#142d2b"
  ink: "#f0f0d9"
  muted: "#b0c6b5"
  leaf: "#d1e2a1"
  gold: "#f0cc88"
  action-ink: "#263f2a"
  action-hover: "#e1efb9"
  dialog: "#213e35"
  specimen: "#304c3c"
  specimen-hover: "#405d43"
typography:
  display:
    fontFamily: 'MossBrush, "KaiTi", serif'
    fontSize: "clamp(42px, 4.5vw, 67px)"
    fontWeight: 400
    lineHeight: 1.28
    letterSpacing: "0.02em"
  headline:
    fontFamily: '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", sans-serif'
    fontSize: "28px"
    fontWeight: 500
    letterSpacing: "0.03em"
  title:
    fontFamily: '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", sans-serif'
    fontSize: "16px"
    fontWeight: 500
  body:
    fontFamily: '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", sans-serif'
    fontSize: "11px"
    fontWeight: 400
  action:
    fontFamily: '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", sans-serif'
    fontSize: "15px"
    fontWeight: 650
rounded:
  key: "4px"
  tag: "6px"
  option: "7px"
  control: "8px"
  action: "9px"
  hud: "10px"
  specimen: "12px"
  compact: "14px"
  dialog: "18px"
  garden: "20px"
  circle: "50%"
spacing:
  tight: "4px"
  control: "8px"
  compact: "12px"
  group: "16px"
  overlay: "24px"
  shell: "48px"
components:
  button-primary:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.action-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.circle}"
    padding: "10px"
    height: "40px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "40px"
  mode-option:
    textColor: "#c4d3b9"
    rounded: "{rounded.option}"
    padding: "7px 12px"
  mode-option-checked:
    backgroundColor: "#d1e2a119"
    textColor: "{colors.leaf}"
  upgrade-card:
    backgroundColor: "{colors.specimen}"
    textColor: "{colors.ink}"
    rounded: "{rounded.specimen}"
    padding: "22px 14px 17px"
  upgrade-card-hover:
    backgroundColor: "{colors.specimen-hover}"
  dialog:
    backgroundColor: "{colors.dialog}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "34px"
  hud-health:
    backgroundColor: "#142d2be8"
    textColor: "{colors.ink}"
    rounded: "{rounded.hud}"
    padding: "10px 14px"
  toast:
    backgroundColor: "#e4eaca"
    textColor: "#263e2f"
    rounded: "{rounded.option}"
    padding: "9px 19px"
  storage-warning:
    backgroundColor: "#303e30"
    textColor: "{colors.gold}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
---

# Design System: 苔光守夜 Mosslight

## Overview

**Creative North Star: "月下生态缸"**

这份名称沿用已落地的画面方向。实时花园是主体：松针绿的底色上分布苔叶、石径、花簇与水塘，淡金微光承担拾取和攻击反馈，紫灰虫影与守夜人的形体形成区分。页面控件贴近花园边缘，留出连续的移动空间；手写标题只在进入花园前建立语气。

界面的实施特征是安静、温和、紧凑。浅叶色按钮指出主要动作，黄绿色与淡金用于有限的强调，说明文字保持绿调。升级、暂停与结算共享同一层深绿对话框；进入游戏后仍然面对同一片 Canvas 花园。以上为当前实现的观察归纳，不构成未经确认的新品牌承诺。

**Key Characteristics:**

- 程序化 Canvas 花园承担主要视觉内容，DOM 控件承担可读信息与操作。
- 一处手写题字与平台中文无衬线组成明确的字体分工。
- 叶色主要动作、淡金焦点与反馈、深绿界面底板。
- 能力标本在桌面横排，在窄屏变为紧凑纵排。
- 图标为原创 SVG 线稿；场景与音效不依赖外部图片或音频。

提取依据：`styles.css`、`index.html`、`src/main.js`、`src/renderer.js`、`PRODUCT.md` 与当前游戏画面（2026-11-21）。前置令牌记录实际用值，不代表已经把所有 CSS 字面量重构为自定义属性；未被界面使用的声明不列为规范令牌。

## Colors

色彩以低明度绿调承托浅叶与微光，次级文字也带绿调。前置令牌是颜色值的规范来源。侧车中的八阶色带仅供面板预览：它们按这些实际颜色推导，不代表项目另有已实现的色阶令牌。

### Primary

- **浅叶光**（`leaf`）：开始、继续、重试等主要动作，以及能力图标、经验条和就绪反馈。主要按钮的文字使用深叶墨（`action-ink`）；悬停变为亮叶色（`action-hover`）。

### Secondary

- **淡金微光**（`gold`）：键盘焦点、能力级别、说明中的动作重点和存储提示。Canvas 的拾取物与萤火使用同一暖光方向，但保留渲染器自己的分层绘画色值。

### Neutral

- **夜松底**（`page`）：页面、滚动条轨道与界面暗部的底色。
- **米白文字**（`ink`）：常规正文与主要信息；**灰绿文字**（`muted`）用于辅助说明、标签和工具按钮。
- **深绿对话框**（`dialog`）：暂停、说明、升级及结算共用的容器底色。
- **标本绿**（`specimen`）与**抬亮标本绿**（`specimen-hover`）：可选择能力的默认与悬停底色。

**The 微光有用途 Rule.** 叶色指出主要动作，淡金指出焦点和反馈；维持现有语义，不把整片界面改成发光控件。

## Typography

**Display Font:** 本地 Ma Shan Zheng 字体子集，以 `MossBrush` 注册，回退到楷体与衬线。文件为 `assets/fonts/title.ttf`，授权原文为 `assets/fonts/OFL-MaShanZheng.txt`；目前子集只包含入口标题所需汉字。

**Body Font:** Microsoft YaHei UI、PingFang SC、Noto Sans SC、sans-serif，按平台可用性回退。正文、按钮、数据与对话框均沿用此栈，没有专用等宽字体。

### Hierarchy

- **Display**：入口两行题字使用前置 `display`；在中等宽度改为（52px），窄屏为（43px，行高 1.25），低矮横屏为（33px）。
- **Headline**：对话框标题使用前置 `headline`；窄屏降为（24px），低矮横屏为（22px）。
- **Title**：能力名使用前置 `title`；窄屏为（15px），低矮横屏为（13px）。品牌中文名独立使用（19px，600，字距 0.08em），窄屏为（16px）；英文副名为（11px，字距 0.18em）。
- **Body**：页面基础使用前置 `body`，窄屏基础降为（13px）。入口说明为（13px，行高 2），窄屏为（11px，行高 1.9）；对话框说明多为（12px）。这是短句游戏界面，未设文章式最大行宽。
- **Label**：HUD、能力说明、手记标签与辅助提示使用前置 `label`。当前可见文字最小值为（11px）。
- **Action**：主要按钮使用前置 `action`，窄屏为（14px）；并排结算动作在窄屏为（12px）。
- **Numbers**：计时、生命值、击杀、手记和结算数据使用等宽数字特性（`tabular-nums`）。计时为（27px），窄屏为（21px）；手记值为（23px），窄屏为（21px）。

**The 题字限用 Rule.** 本地手写子集只承担已覆盖的入口题字；其他控件与动态内容继续使用正文栈。

## Layout

页面外壳居中，默认最大宽度（1480px），左右留白使用 `shell`。顶部品牌与工具处于同一横排（高 110px）；下面的花园是单一、裁切溢出的相对定位区域，默认高（`min(660px, calc(100svh - 230px))`）、最小高（490px）。入口文字位于左侧渐变遮罩上；游戏 HUD 是贴近四角的覆盖层，不把花园切成独立面板。手记与页脚位于场景下方。

- **宽屏（min-width: 1600px）**：外壳最大宽度（1510px），花园高（700px）。
- **中屏（max-width: 1100px）**：外壳左右（28px），顶栏高（88px），隐藏顶栏短句；花园高（600px）、最小高（490px）；入口内边距从左右（7%）改为（6%）。
- **窄屏（max-width: 700px）**：外壳左右（16px），顶栏高（78px），隐藏全屏按钮；花园高（650px）、最小高（540px）、最大高（`calc(100svh - 92px)`）。入口改为上方渐变，内容内边距（66px 27px 0）。手记变为单列，三个记录仍横排。HTML 内容仍在正常文档流中，页脚可以位于首屏以下。
- **手机游玩（max-width: 900px 且进入游戏）**：在窄屏设备上，隐藏站点页脚和手记并锁定页面滚动，让花园与顶栏填满可用视口；花园高度响应状态。游戏 HUD 使用有界三列，避免狭屏生命值和计时互相挤压。
- **低矮横屏（max-height: 520px 且 landscape）**：顶栏高（58px），花园高（`calc(100svh - 68px)`）、最小高（280px），隐藏入口说明、手记与页脚；升级选项恢复三列。
- **全屏**：花园铺满（100svh）并取消圆角；不扩展为另一套页面。

紧凑控件常见（8px）间距，能力卡与工具组常见（12px），HUD 分组使用（16px），对话框遮罩内边距为（24px）。前置 `spacing` 只提取这些复用值；实际布局另有按内容设定的尺寸。桌面 HUD 上/左右内缩（22px / 28px），底部同样为（22px / 28px）；窄屏上 HUD 内缩（15px / 12px），底部为（15px / 13px）。

触屏能力由根元素 `.touch-device` 决定，来源是 `maxTouchPoints` 或粗指针检测，不按屏宽或最后一次点击切换。它显示摇杆和冲刺键、替换操作提示、隐藏桌面冲刺状态；混合输入设备鼠标点击后仍保留触屏控件。摇杆可固定拖动，也支持在 Canvas 左半侧轻触拖动移动；触屏可见摇杆 104px，旋钮为 40px，冲刺键为 70px。渲染器按 Canvas 自身宽度小于 700px 时缩放至 0.82；游戏开始后按当前 Canvas 可见范围更新生成边界与索敌距离。桌面 Canvas 像素比限制为 2，触屏设备限制为 1.35。

v1.2 摄像机在游玩时保留有限的地图外观察区，四角角色仍需避开顶栏和触控区；地面边界外绘制更暗的缓存林地，地图可移动范围不变。菜单构图沿用原有取景。

## Elevation & Depth

DOM 深度来自有透明度的夜松底板、单层暗色遮罩与柔和中性色投影。背景始终可辨认；没有装饰性毛玻璃。Canvas 内微光是游戏对象的光效，与界面投影分开维护。

### Shadow Vocabulary

- **花园投影**：场景整体下方的中性柔影（`0 18px 65px #00000030`）。
- **对话框投影**：打断游玩时承托主要容器（`0 16px 60px #00000040`）。
- **巨蛾标签文字阴影**：小字覆盖复杂场景时增强区分（`0 1px 3px #142d2b`）。

**The 中性投影 Rule.** 界面投影沿用有垂直位移的黑色柔影；发光留给花园中的萤火与微光。

## Shapes

场景、对话框与能力标本的圆角逐级收敛：前置 `garden`、`dialog` 与 `specimen` 分别对应整体花园、打断层容器和可选能力。窄屏花园与对话框都使用 `compact`。动作按钮、模式选项和 HUD 使用较小圆角；小能力标签与键帽更紧凑。

圆形只用于图标按钮、摇杆与触屏冲刺键，主要开始按钮是横向圆角矩形。能力卡使用细线框（1px）与底色变化，不添加单独投影。全局 SVG 默认为（20px）、圆端点与圆转角、线宽（1.65）；品牌叶片（40px / 1.15），能力图标（35px / 1.2）是明确的局部变体。

## Components

### Buttons and game tools

主要动作使用 `button-primary`，桌面最小尺寸（224px × 52px），窄屏为（206px × 48px）；对话框单个主按钮最小宽（200px）。悬停底色变亮、向上移动（2px），按下回到原位，过渡（0.18s）。次要按钮为透明底、绿灰细边框，最小高（44px），悬停只改变底色。并排对话框动作默认最小宽（140px），窄屏为（115px）。

顶部工具是真实 `nav`，包含带文字的说明、音效开关与桌面全屏。默认透明底、灰绿文字，悬停用更亮的深绿底和主文字色；图标按钮圆形，文字按钮小圆角。音效通过 `aria-pressed` 和图标共同表达状态。禁用按钮透明度（0.5）、默认指针；触屏冲刺在冷却时复用此状态。

所有按钮、链接、Canvas，以及模式选项的可见标签，共享淡金键盘焦点（2px 轮廓，偏移 5px）。焦点显示与悬停是不同状态；非键盘焦点不强制保留轮廓。

### Mode options

v1.4 在模式选项与开始按钮之间加入守夜人行，使用叶色 SVG、角色名、简要属性和“更换”文字；以细分隔线组织，不新增卡片阵列。选择层为三行原生单选输入，各行展示相同层级的名称、特点、属性与取舍。低矮横屏将角色行放在标题右侧，开始按钮仍在左侧原位。选择即时保存，完成后返回菜单。

两枚小圆角选项是原生单选输入的可见标签，组成有图例的 `fieldset`。默认描边与灰绿文字；选中后换成叶色边框、叶色文字和低透明度叶色底。尺寸随内容变化，桌面内边距（7px 12px），窄屏为（6px 11px）。没有额外的文本输入框或筛选栏。

### Upgrade specimens

能力选择是可点击的标本按钮：图标、能力名、金色级别、说明、按当前能力值计算的效果变化与数字快捷键。桌面三等列、间距（12px）、最小高（205px）；窄屏改成一列、间距（9px）、最小高（106px），图标位于左侧，名称与级别、说明与实际变化分别占行，并隐藏快捷键文字。悬停向上（4px）并抬亮底色，过渡（0.15s）；数字键 1–3 与鼠标、触屏选择同一能力。

能力选择底部增加“换一组”次要按钮，每局一次；剩余可选池不足以替换时禁用，不消耗次数。手机用短说明与按钮并排，弹窗可在低矮视口滚动。

### HUD and records

生命与经验、居中计时、击杀与暂停分为三个紧凑底板。窄屏仍维持三列，不遮挡彼此；HUD 是每 80ms 内更新一次的实时信息，文本与血条数值未改变时不写入 DOM。生命条使用暖粉色，低生命时更亮并显示数值色变；经验与冲刺使用叶色，并显示当前经验值。已选能力以小标签显示。巨蛾血条单独位于计时下方，默认宽（`min(300px, 60%)`）。普通 HUD 容器不拦截场景指针，实际按钮恢复可交互。

手记是三个 `dl` 数据项与轻量标题，不是卡片阵列。未有成绩时显示真实的（0、0 次、00:00），没有伪造的示例成绩。窄屏保留数据并隐藏仅解释本地保存的右侧附注。

画外巨蛾用有方向性的边缘箭头和“巨蛾”文字提示；进入画面后移除。箭头位置避开上方 HUD 和下方触控区，蓄力时使用现有粉色预警色。

### Dialogs

暂停、升级、说明、放弃确认和结果共享场景内遮罩与 `dialog`；默认容器最大宽（680px）、内边距（34px），窄屏内边距（26px 18px），允许容器内部纵向滚动。遮罩覆盖花园而非整个文档，背景为半透明深色，没有模糊滤镜。标题和引导说明保持相同层级；结果统计三等列。

显示时保存原焦点并将焦点移到首个按钮、原生输入或 summary，Tab 在对话框内部循环，关闭后恢复焦点。切换窗口自动暂停；对话框承担真实的暂停、选择或确认任务。

v1.3 的图鉴、设置与足迹继续使用同一暂停层；多层面板返回原来源。图鉴用原生 details / summary，能力来自规则数据。设置使用原生复选框、滑块和单选框，保留叶色 accent 和淡金焦点；即时保存不重新创建输入。暂停优先显示继续按钮，再显示八项属性的 dl；桌面四列、小屏两列。足迹为有分隔线的原生列表，空态说明如何获得第一条记录，进行中禁止重试。菜单长面板高度受可视区约束，内部滚动。结果的新纪录使用淡金文字，同种子重试与返回沿用次按钮。

### Status and recovery

v1.6 沿用两枚原生模式选项，在同一行加入淡金“每日守望”按钮，下方一行灰绿日期 / 角色信息。每日说明使用已有暂停层，图标和人物名后接属性与本机三项记录；开始 / 返回动作沿用现有按钮。日期提示不作为新的装饰性标题标签。

结算的复制摘要入口打开原生只读 textarea 和复制 / 返回按钮。正文 16px 避免 iOS 聚焦放大，明示操作、视口和版本对进程的影响。复制成功 / 失败用面板内 status 更新；失败将文本选中以便用户手动操作。分享参数有效时在菜单显示次按钮，已有暂存入口仍保留；小屏收紧标题与说明留白，低矮横屏将次操作放在右侧，不能覆盖开始按钮。

v1.5 在开始按钮下显示真实待续进度：次按钮“继续上一局”和角色 / 模式 / 已用时间 / 等级短句，无待续时整体隐藏。窄屏有暂存时收紧入口顶部留白；低矮横屏将续玩区放在角色行下方，与开始按钮分开。暂停显示暂存并返回动作和一行保存结果，失败说明刷新限制，不能写入时留在游戏。覆盖待续进度使用已有确认层，默认焦点放在保留动作。打开对话框、返回菜单时清除旧战斗提示，避免遮挡。

能力标本在实际数值变化下增加 11px 灰绿短句，表达当前多发 / 叶环配合或实际可恢复生命；移动端为第四行，依然用整个按钮作触控目标。提示与数值相邻，不新增推荐徽章。长选项保持内部滚动。

v1.4 保留受伤敌人血条，实际回血数字为叶色、受击为暖粉，轻量模式取消普通伤害数字，保留必要反馈。角色免伤时透明度提高，脚边弧线显示冲刺恢复进度。巨蛾粉色带状预警与边线表达实际碰撞危险范围，并在角色之前绘制，避免覆盖角色轮廓。角色服饰使用既有绿色近邻区分三种开局，形象与场景仍是原创 Canvas。

结果使用原生 details 展开五项战斗数据，默认收起以保证主要重试动作可见；有伤害来源时显示具体虫影名。足迹标题加入守夜人，旧局数据按提灯显示；不为旧战斗统计补造数值。

短时提示是淡色小底板，位于场景底部中间；通过（0.2s）的透明度与（8px）位移进入，约三秒后消失，`role=status` 配合 `aria-live=polite`。窄屏位置上移，避开触屏操作区。

存储不可用提示位于 `main` 上方、花园之外，与右侧本地保存附注互斥显示。它使用淡金文字、低调细框和深绿底，说明本局仍可玩与关闭页面后成绩不保留；窄屏仍然显示该提示。无 JavaScript 时显示明确的启用提示；本地即时操作没有模拟加载骨架。

### Motion and media

主要连续动态是同一花园中的角色、粒子和摄像机跟随；地形先绘制到离屏 Canvas，再用于场景绘制。游戏逻辑固定每 60Hz 计算，游玩画布按 requestAnimationFrame 绘制；菜单桌面最多 30Hz、触屏最多 20Hz，暂停与结果状态只在状态或尺寸变化时绘制。HUD 避免重复的文本和样式写入。相同尺寸与颜色的发光画笔在首次使用后缓存；视野外的飞弹与微光不绘制，视野外的敌人跳过绘制排序。DOM 只保留按钮、能力选择与提示的短过渡。减少动态效果设置会移除 CSS 过渡和悬停位移；渲染器冻结装饰摆动时间并减少粒子数量，游戏逻辑与必要反馈继续运行。

## Do's and Don'ts

### Do:

- **Do** 先保留花园的连续空间，再把信息放到边缘或真实的暂停层。
- **Do** 让叶色继续表示主要动作，让淡金继续表示焦点与反馈。
- **Do** 为每个图标按钮提供可读名称，并保留淡金键盘焦点。
- **Do** 在窄屏把能力标本改为横向信息结构，而不是缩小所有文字。
- **Do** 用真实记录和明确的存储失败说明表达本机状态。
- **Do** 同时检查键盘、触屏与混合输入设备，保持触屏控件能力判定稳定。

### Don't:

- **Don't** 把手写字体子集用于动态能力名、数字或其他未覆盖文案。
- **Don't** 把 SVG 图标替换成 emoji，或引入来源与许可不清的场景素材。
- **Don't** 把界面投影改成彩色光晕，混淆花园光效与控件层次。
- **Don't** 为入口增加与游玩无关的卡片阵列或额外标题前标签。
- **Don't** 把低于当前最小字号的文字当作移动适配方案。
- **Don't** 把 DOM 焦点与键盘支持描述为整款动作游戏已经实现非视觉替代模式。
