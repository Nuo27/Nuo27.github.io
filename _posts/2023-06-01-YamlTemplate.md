---
title: "Yaml Template"
author: Nuo Chen
excerpt: "A post to test start."
tags:
  - template
  - yaml
categories:
  - setup
toc: true
toc_label: "Table of Contents"
toc_icon: "cog"
toc_sticky: true
header:
  overlay_color: "#333"
author_profile: true
---

can start the YAML front matter with:

# Post

```
---
# YAML front matter
layout: the layout
classes: # the css class
  - landing
  - dark-theme
  - wide # expand the main content to the right

# page meta
title: "the Title"
author: the Author
excerpt: "the excerpt description"
canonical_url: "the custom canonicl url"

# page tags and categories
tags:
  - template
  - test
categories:
  - blogs

# Table of Contents
toc: true
toc_label: "Table of Contents"
toc_icon: "cog"
toc_sticky: true

#exclude specific pages/posts from the search index
search: false

#header
header:
  image: /assets/images/image.jpg
  image_description: "A description of the image"
  overlay_image: /assets/images/image.jpg
  overlay_filter: 0.5, rgba(255, 0, 0, 0.5) # or a linear gradient
  overlay_color: "#333" # or a CSS color

  show_overlay_excerpt: true
  tagline: "the tagline" # Overrides page excerpt
  actions:
    - label: "the label"
      url: "the url"
    - label: "the second label"
      url: "the second url"
  caption: "Image caption"
  og_image: /assets/images/your-og-image.jpg # Open Graph image

#sidebar
sidebar:
  - title: "Title"
    image: http://placehold.it/350x250
    image_alt: "image"
    text: "Some text here."
  - title: "Another Title"
    text: "More text here."
#author profile
author_profile: true
---
```

# Page

```
layout: single
title: "About"
permalink: /about # should never be in posts but ok
toc: true
toc_label: "Table of Contents"
toc_icon: "cog"
author_profile: true

taxonomy: # category name
entries_layout: # list (default), grid
```

# navigation sidebar

in \_data/navigation.yml

```
docs:
  - title: Getting Started
    children:
      - title: "Quick-Start Guide"
        url: /docs/quick-start-guide/
      - title: "Structure"
        url: /docs/structure/
      - title: "Installation"
        url: /docs/installation/
      - title: "Upgrading"
        url: /docs/upgrading/

  - title: Customization
    children:
      - title: "Configuration"
        url: /docs/configuration/
      - title: "Navigation"
        url: /docs/navigation/
      - title: "UI Text"
        url: /docs/ui-text/
      - title: "Authors"
        url: /docs/authors/
      - title: "Layouts"
        url: /docs/layouts/

  - title: Content
    children:
      - title: "Working with Posts"
        url: /docs/posts/
      - title: "Working with Pages"
        url: /docs/pages/
      - title: "Working with Collections"
        url: /docs/collections/
      - title: "Helpers"
        url: /docs/helpers/
      - title: "Utility Classes"
        url: /docs/utility-classes/

  - title: Extras
    children:
      - title: "Stylesheets"
        url: /docs/stylesheets/
      - title: "JavaScript"
        url: /docs/javascript/
```

then in YAML front matter

```
sidebar:
  nav: "docs"
```

or in \_config.yml

```
defaults:
  # _docs
  - scope:
      path: ""
      type: docs
    values:
      sidebar:
        nav: "docs"
```

# Reference

[QuickStartGuide](https://mmistakes.github.io/minimal-mistakes/docs/quick-start-guide/)
