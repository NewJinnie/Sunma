import { Node } from '@tiptap/core';

const LinkPreview = Node.create({
  name: 'linkPreview',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      title: {
        default: null,
      },
      description: {
        default: null,
      },
      url: {
        default: null,
      },
      textWrapperClass: {
        default: null,
      },
      imageWrapperClass: {
        default: null,
      },
      imageClass: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div', preserveWhitespace: 'full' }];
  },

  renderHTML({ node }) {
    return [
      'div',
      { class: 'link-preview-wrapper' },
      [
        'a',
        { class: 'link-preview-url', href: node.attrs.url, target: '_blank' },
        [
          'div',
          { class: node.attrs.textWrapperClass },
          ['p', { class: 'link-preview-title' }, node.attrs.title],
          ['p', { class: 'link-preview-description' }, node.attrs.description],
          ['p', { class: 'link-preview-url' }, new URL(node.attrs.url).origin],
        ],
        [
          'div',
          {
            class: node.attrs.imageWrapperClass,
          },
          [
            'img',
            {
              src: node.attrs.src,
              class: node.attrs.imageClass,
            },
          ],
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setLinkPreview:
        attributes =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});

export default LinkPreview;
