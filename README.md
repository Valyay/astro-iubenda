# astro-iubenda

This Astro integration fetches and provides Iubenda Privacy Policy, Cookie Policy, and Terms & Conditions content for your Astro project.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![codecov](https://codecov.io/gh/Valyay/astro-iubenda/branch/main/graph/badge.svg)](https://codecov.io/gh/Valyay/astro-iubenda)

## Why astro-iubenda?

[Iubenda](https://www.iubenda.com/) is a popular service that helps websites comply with legal requirements for privacy policies and terms of service. This integration simplifies the process of fetching and displaying Iubenda legal documents in your Astro project.

### Features

**🔄 Automatic document fetching** - Automatically fetches your Iubenda Privacy Policy, Cookie Policy, and Terms & Conditions at build time.

**🎯 Multiple access methods** - Access documents via a virtual module or as JSON files written to disk.

**🔧 Flexible configuration** - Strip HTML markup for easier styling, configure output directories, and more.

**⚡ Zero dependencies** - Lightweight integration with no external dependencies, keeping your project slim.

**📦 Tiny footprint** - Only 1.89 kB (minified and gzipped). [Size Limit](https://github.com/ai/size-limit) controls the size.

**🔍 SEO-friendly** - Properly renders legal documents for better search engine indexing.

**🔥 HMR support** - Changes to configuration are reflected immediately with Hot Module Replacement.

**🌐 Multilingual support** - Handle documents in multiple languages with ease.

**📱 Responsive-ready content** - Works with any responsive design approach.

**🧩 TypeScript native** - Full TypeScript support with proper typings for improved developer experience.

**⚙️ Framework agnostic** - Works with any UI framework or vanilla HTML within your Astro project.

**🔄 Compatible with all Astro rendering modes** - Works with SSG, SSR and hybrid rendering.

## Usage

### Installation

```bash
# Using npm
npm install astro-iubenda

# Using yarn
yarn add astro-iubenda

# Using pnpm
pnpm add astro-iubenda
```

### Finding Your Document IDs

To get your document IDs:

1. Log in to your [Iubenda dashboard](https://www.iubenda.com/en/dashboard)
2. Select your project
3. Find the document ID in the URL when viewing your policy:
   ```
   https://www.iubenda.com/privacy-policy/12345678
   ```
   Where `12345678` is your document ID

You can also find this ID in the embedded code section as described in the [Direct Text Embedding API documentation](https://www.iubenda.com/en/help/78-privacy-policy-direct-text-embedding-api).

If you have policies in multiple languages or for different purposes, you can use multiple document IDs in the configuration.

### Adding the Integration

Add the integration to your `astro.config.mjs` file:

```js
import { defineConfig } from "astro/config";
import iubenda from "astro-iubenda";

export default defineConfig({
  // ...
  integrations: [
    iubenda({
      documentIds: [<your-document-id>],
    }),
  ],
});
```

### Adding the Integration

Then import the documents in your Astro components:

```astro
---
import { getDocument } from 'virtual:astro-iubenda';

const privacyPolicy = getDocument(<your-document-id>, 'privacyPolicy');
const cookiePolicy = getDocument(<your-document-id>, 'cookiePolicy');
const termsAndConditions = getDocument(<your-document-id>, 'termsAndConditions');
---

<div set:html={privacyPolicy}></div>
```

## Configuration

To configure this integration, pass an options object to the `iubenda()` function in your `astro.config.mjs` file.

```js
iubenda({
  documentIds: [<your-document-id>],
  saveInJson: true,
  outputDir: "src/content/iubenda",
  stripMarkup: true,
});
```

| Parameter     | Type                      | Required | Default                 | Description                                                                                      |
| ------------- | ------------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `documentIds` | `Array<string \| number>` | Yes      | -                       | Array of Iubenda document IDs to fetch. You can find your document ID in your Iubenda dashboard. |
| `saveInJson`  | `boolean`                 | No       | `false`                 | Whether to write the fetched documents to disk as JSON files.                                    |
| `outputDir`   | `string`                  | No       | `'src/content/iubenda'` | Directory where JSON files will be written if `saveInJson` is true.                              |
| `stripMarkup` | `boolean`                 | No       | `true`                  | Whether to strip HTML markup from the fetched documents.                                         |

## API

The integration provides a virtual module that you can import in your components.

### documents

Full object with all fetched documents, keyed by document ID.

```js
import { documents } from "virtual:astro-iubenda";

// Access all policies for a specific document ID
const allPolicies = documents["12345678"];

// Access a specific policy directly
const privacyPolicy = documents["12345678"].privacyPolicy;
```

### getDocument(id, type)

**Parameters:**

- `id` - Document ID to retrieve
- `type` - Type of document ('privacyPolicy', 'cookiePolicy', or 'termsAndConditions')

**Returns:** The document content as a string, or null if not found.

```js
import { getDocument } from "virtual:astro-iubenda";

const privacyPolicy = getDocument("12345678", "privacyPolicy");
```

## Examples

### Basic Usage

```astro
---
import { getDocument } from 'virtual:astro-iubenda';
---

<html>
  <head>
    <title>Privacy Policy</title>
  </head>
  <body>
    <h1>Our Privacy Policy</h1>
    <div set:html={getDocument('12345678', 'privacyPolicy')}></div>
  </body>
</html>
```

### Using the documents object directly

```astro
---
import { documents } from 'virtual:astro-iubenda';

// Access all documents and their types for a specific ID
const docId = '12345678';
const allDocsForId = documents[docId];

// Access specific documents directly
const privacyPolicy = documents[docId].privacyPolicy;
const cookiePolicy = documents[docId].cookiePolicy;
const terms = documents[docId].termsAndConditions;
---

<h2>Available Documents</h2>
<ul>
  {privacyPolicy && <li><a href="/privacy">Privacy Policy</a></li>}
  {cookiePolicy && <li><a href="/cookies">Cookie Policy</a></li>}
  {terms && <li><a href="/terms">Terms and Conditions</a></li>}
</ul>

<!-- Using the full document object -->
<div class="policies">
  {Object.entries(allDocsForId).map(([type, content]) => (
    <div class="policy-preview">
      <h3>{type}</h3>
      <div class="preview" set:html={content.substring(0, 200) + '...'} />
    </div>
  ))}
</div>
```

### Multiple Documents

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import iubenda from "astro-iubenda";

export default defineConfig({
	integrations: [
		iubenda({
			documentIds: ["12345678", "87654321"],
			saveInJson: true,
		}),
	],
});
```

```astro
---
import { documents } from 'virtual:astro-iubenda';
---

<select id="policy-selector">
  <option value="12345678">English</option>
  <option value="87654321">Spanish</option>
</select>

<div id="policy-content"></div>

<script>
  const selector = document.getElementById('policy-selector');
  const content = document.getElementById('policy-content');
  const documents = {JSON.stringify(documents)};

  selector.addEventListener('change', () => {
    const id = selector.value;
    content.innerHTML = documents[id].privacyPolicy;
  });

  // Set initial content
  content.innerHTML = documents[selector.value].privacyPolicy;
</script>
```

## Contributing

You're welcome to submit an issue or PR!

## Changelog

See [GitHub releases](https://github.com/Valyay/astro-iubenda/releases) for a history of changes to this integration.

## License

MIT - see [LICENSE](LICENSE) for details.

## Inspiration

[gatsby-source-iubenda-documents](https://github.com/HeinrichTremblay/gatsby-source-iubenda-documents)
