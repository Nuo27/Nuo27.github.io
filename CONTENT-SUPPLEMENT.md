# 内容补充指南

这份文档列出所有需要你手动补充的内容。每一项包含：**放在哪里**、**回答哪些问题**、**示例格式**。

按优先级排序，从上往下做即可。所有占位符都已实装到网站中（带 `TODO` 注释），可以直接搜索 `<!-- TODO:` 或 `TODO:` 找到全部位置。

---

## 1. 项目技术深度（最重要）

招聘方看项目页时最想看到的不是"你做了什么"，而是"你遇到了什么问题、怎么解决的"。这是区分"参与者"和"解决问题的人"的关键。

### 放在哪里

每个项目的 `.md` 文件中，已经预置了 `## Technical Challenges` 和 `## Lessons Learned` 两个板块（带 `TODO` 注释和提示问题），直接替换即可。

| 项目 | 文件 |
|------|------|
| Shatter | `_projects/Shatter.md` |
| Wistful | `_projects/wistful.md` |
| Pondiberry Lodge | `_projects/thetragedyofpondiberrylodge.md` |
| Ascension to Immortal | `_projects/Ascension to Immortal.md` |
| Reserve Now | `_projects/reservenow.md` |

### 每个项目回答这些问题

#### Shatter（`_projects/Shatter.md`）
- EOS 匹配过程中遇到的最大技术问题是什么？（NAT 穿透？延迟？断线重连？）
- C++ 和 Blueprints 之间是怎么分工的？哪些逻辑放 C++，哪些放 Blueprint？
- 能力系统（4个可切换能力）是怎么架构的？用了什么设计模式？
- knockback 物理是怎么实现的？有什么坑？
- FMOD 自适应音频的具体逻辑是什么？（什么事件触发什么音频变化）

#### Wistful（`_projects/wistful.md`）
- 环境解谜系统是怎么设计的？ puzzles 之间怎么链式触发？
- "interconnection" between levels 是怎么实现的？数据怎么传递？
- 6人团队协作中，你的代码怎么和别人的对接？用了什么 Git 工作流？

#### The Tragedy of Pondiberry Lodge（`_projects/thetragedyofpondiberrylodge.md`）
- 作为唯一程序员，你怎么设计交互框架让4个非程序员队友能独立做关卡？
- 5个关卡之间的进度系统是怎么实现的？
- 你写的"集成指南"具体包含什么？能举个例子吗？
- 最难整合的 bug 是什么？怎么发现的？

#### Ascension to Immortal（`_projects/Ascension to Immortal.md`）
- Mirror 框架的 LAN 同步有什么限制？你怎么解决的？
- 回合制逻辑在多人环境下怎么保证状态一致性？
- solo 开发3个月，你是怎么做项目管理的？

#### Reserve Now（`_projects/reservenow.md`）
- 双角色界面（customer/staff）是怎么架构的？共享了多少代码？
- SQL 数据库是怎么设计的？几张核心表？
- 这个项目让你学到了什么（和游戏开发不同的思维）？

### 示例格式

替换占位符时，把整段 `## Technical Challenges` 下的内容替换成类似：

```markdown
## Technical Challenges

### EOS NAT 穿透问题

最初玩家在对等网络下无法互相连接。我排查后发现 EOS 的 P2P 连接在某些
NAT 类型下失败。解决方案是改用 EOS 的 relay server 作为 fallback，
并在连接超时后自动切换。最终连接成功率从 ~60% 提升到 ~95%。

### C++ / Blueprint 分层

C++ 负责核心系统（伤害计算、网络复制、游戏模式逻辑），Blueprint 负责
设计师可调整的参数和视觉表现。接口通过 `UPROPERTY(EditAnywhere)`
暴露给 Blueprint，让设计师无需改代码就能微调能力参数。
```

---

## 2. 个人起源故事

### 放在哪里

`pages/about.md` 的 `intro.paragraphs:` 列表（front matter）。在末尾新增一个 `- text:` 条目（Markdown 语法），并删掉现有的 `placeholder: true` 占位条目。渲染由 `_layouts/about.html` → `_includes/about/intro.html` 经 `markdownify` 处理。

### 回答这些问题

- 你第一次接触游戏开发是什么时候？（玩某个游戏？看某个视频？改 mod？）
- 你为什么选择游戏开发而不是普通软件开发？
- 你写的第一行游戏代码是什么？（什么引擎、什么项目）
- 有没有一个"啊哈时刻"让你决定"我要做这个"？

### 示例格式

替换 `pages/about.md` 中 `intro.paragraphs:` 末尾的占位条目为（Markdown 语法，会经 `markdownify` 渲染）：

```yaml
  paragraphs:
    # ...前面的段落...
    - text: >-
        我第一次接触游戏开发是在 ___。当时我 ___，突然意识到 ___。那之后我开始学 ___，
        并最终选择了 UTS 的 Game Development 专业。
```

---

## 3. "Now" 板块

### 放在哪里

`pages/about.md` 的 `currently.items:` 列表（front matter）。每个条目把 `value` 填入实际内容，并把 `placeholder: true` 改为 `false`（或删除该行）即可——`[ ]` 方括号只对占位条目自动添加。

### 回答这些问题（定期更新）

- **LEARNING：** 最近在深入研究什么技术/引擎/工具？
- **BUILDING：** 当前在做什么原型/项目？
- **PLAYING：** 在玩什么游戏？在研究它的什么？
- **READING：** 在读什么技术书/文章？

### 示例格式

把 `pages/about.md` 中 `currently.items:` 对应条目改为：

```yaml
  items:
    - { label: LEARNING, value: "UE5 Gameplay Ability System (GAS)" }
```

删掉 `placeholder: true`，样式即恢复正常，`[ ]` 方括号也不会再自动添加。

---

## 4. 远程 GitHub 仓库描述

### 放在哪里

4个远程仓库（`UE4-fps-template`, `MASH_recreation`, `Pacman_recreation`, `Potplayer-Ollama-Translate`）的描述**不能**在网站这边设置——它们从 GitHub API 拉取（`site.github.public_repositories`）。

### 怎么解决

- **方案A（推荐）：** 去每个 GitHub 仓库的 Settings → Description 直接写中文/英文描述。网站会自动拉取。
- **方案B：** 在 `_includes/projects/index.html` 里加一个本地描述映射覆盖（如果你不想动 GitHub）

### 为每个仓库回答

- **UE4-fps-template** — 这是什么？学习用途？练手？
- **MASH_recreation** — MASH 是什么？你在复现什么？
- **Pacman_recreation** — 用什么技术栈做的？目的是什么？
- **Potplayer-Ollama-Translate** — 这个最有趣。怎么工作的？用了 Ollama 的什么模型？为什么做这个？

### 建议优先级

`Potplayer-Ollama-Translate` 最值得展开，因为它展示了 AI 工具链的兴趣和能力。其他3个如果是早期学习练手项目，写一句即可。

---

## 5. 设计哲学文章

### 放在哪里

`_articles/design-philosophy.md`（已创建占位符文件）。每个章节都有引导提示。

### 回答这些问题

- 你认为"好游戏"的定义是什么？
- 你最看重游戏的哪个方面？（手感？叙事？系统深度？美术？）
- 你做游戏时最坚持的原则是什么？
- 有哪个游戏深刻影响了你的设计观？

### 示例格式

把 `> *[ ... ]*` 的占位符 blockquote 替换为实际段落，删除 `TODO` 注释。

---

## 6. 经历补充

### 放在哪里

`_data/timeline.yml` 文件末尾（已有 `TODO: Add more timeline entries` 注释和模板）。

### 可以补充的

- **Game Jam** 参与（Global Game Jam / Ludum Dare / 校内 Jam？）
- **社区活动**（UTS 游戏开发社团？Sydney 游戏开发者聚会？）
- **自学里程碑**（"开始学 UE5"、"完成第一个多人游戏"等转折点）
- **教学/分享**（有没有给同学讲技术、做过 lightning talk）
- **实习/兼职**（如果有的话）

### 示例格式

删除 `# TODO: ...` 注释块，复制模板条目，修改内容：

```yaml
- title: "Global Game Jam 2024 — Sydney"
  from: 2024
  to: 2024
  side: left
  description: >-
    在48小时 Game Jam 中和3人团队完成了 ___。负责 ___。
```

---

## 7. 项目反思（"如果重来"）

### 放在哪里

每个项目的 `.md` 文件中，已经预置了 `## Lessons Learned` 板块（带 `TODO` 注释），直接替换即可。

### 每个项目回答

- 如果重做这个项目，你会改变什么？
- 这个项目教会了你什么（技术层面 + 软技能层面）？
- 你最骄傲的部分是什么？

### 示例格式

替换 `## Lessons Learned` 下的占位符 blockquote 为：

```markdown
## Lessons Learned

如果重来，我会：
1. **更早做集成测试** — 我们直到最后两周才发现跨关卡的 bug
2. **用 ScriptableObject 管理关卡数据** — 而不是硬编码在场景里
3. **更严格的 Git 分支策略** — 场景合并冲突浪费了大量时间

这个项目教会了我：架构决策在第1周就决定了第8周是天堂还是地狱。
```

---

## 8. 推荐语（可选但高价值）

### 放在哪里

`pages/about.md` 的 `testimonials.items:` 列表（front matter）。把 `quote` / `author` 填入实际内容，并把 `placeholder: true` 删除即可（`.placeholder` class 由 include 根据该字段自动添加）。

### 怎么获取

找2-3个人帮你写一两句话：
- UTS 的教授 / 导师
- Pondiberry 或 Shatter 的队友
- 实习 / 兼职的主管（如果有的话）

### 示例格式

把 `pages/about.md` 中 `testimonials.items:` 的占位条目改为：

```yaml
  items:
    - quote: "Nuo 是我见过最可靠的团队领导。他不仅代码写得好，还能让整个团队的技术水平提升。"
      author: "队友姓名，Pondiberry Lodge 团队成员"
```

删掉 `placeholder: true` 即可。多段推荐就在列表里多加几个条目。

---

## 优先级总结

| 顺序 | 任务 | 预计耗时 | 影响 |
|------|------|----------|------|
| 1 | 项目技术挑战（至少做 Shatter + Pondiberry） | 2-3小时 | 极高 |
| 2 | 项目反思（Lessons Learned） | 1小时 | 中 |
| 3 | "Now" 板块 | 15分钟 | 高 |
| 4 | 远程仓库描述（GitHub 上直接写） | 15分钟 | 中 |
| 5 | 起源故事 | 30分钟 | 高 |
| 6 | 设计哲学文章 | 1小时 | 中 |
| 7 | 经历补充 | 30分钟 | 中 |
| 8 | 推荐语（需要联系他人） | 不确定 | 高 |

做完 1-4 就能让网站内容深度有质的提升。

---

## 占位符快速定位

在编辑器中搜索以下标记可以快速找到所有占位符位置：

| 搜索词 | 出现在 |
|--------|--------|
| `TODO:` | 所有占位符附近 |
| `class="placeholder"` | 需要替换的占位符文本（删除 class 即可恢复正常样式） |