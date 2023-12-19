---
layout: page
title: About
permalink: /about/
weight: 1
---

# **About Me**

Hi I am **{{ site.author.name }}** :wave:,<br>
I am a recently Graduate from UTS studying Game Development as major and Data analytics as minor. I mainly using C#,C++ in Unity and Unreal Engine. Python for analysing data. Java,Swift for application Development, and SQL for Database management. I've done a few original games, which can be found in the portfolio, and some classic games recreations. I've also completed serveral applications, plugins or element systems from school projects.

<div class="row">
{% include about/skills.html title="Programming Skills" source=site.data.programming-skills %}
{% include about/skills.html title="Other Skills" source=site.data.other-skills %}
</div>

## Languages
* Mandarin  | Native
* Cantonese | Native
* English   | Proficient
* Japanese  | Beginner
* Korean    | Beginner


<div class="row">
{% include about/timeline.html %}
</div>

## Resumes
{% capture list_items %}
Common resume,/assets/resumes/nuo_resume_common.pdf
academy texted resume,/assets/resumes/nuo_resume_academy.pdf
casual resume,/assets/resumes/nuo_resume_casual.pdf
{% endcapture %}
{% include elements/list.html title="Resumes in PDF" %}

## Contact Me
if you have any questions or want to contact me, please feel free to email me at [{{ site.author.email }}](mailto:{{ site.author.email }}) or contact me on [LinkedIn](https://www.linkedin.com/in/nuochen27/).
