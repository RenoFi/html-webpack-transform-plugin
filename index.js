// eslint-disable-next-line import/no-unresolved
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PLUGIN_NAME = 'HtmlWebpackTransformPlugin';

const handleAssetPath = (assetPath, publicPath, pathPrefix, replace) => {
  if (!(replace && assetPath.indexOf(publicPath) === 0)) {
    return `${pathPrefix}${assetPath}`;
  }
  return `${pathPrefix}${assetPath.substring(publicPath.length)}`;
};

const updateTags = ({
  attributes: additional, tags, prefix, publicPath, replace, transform,
}) => tags.map(({ attributes, tagName, ...tag }) => ({
  ...tag,
  attributes: {
    ...attributes,
    ...(attributes.src
      ? {
        src: handleAssetPath(attributes.src, publicPath, prefix, replace),
      }
      : {}),
    ...(attributes.href
      ? {
        href: handleAssetPath(attributes.href, publicPath, prefix, replace),
      }
      : {}),
    ...(additional && additional[tagName] ? additional[tagName] : {}),
  },
  tagName,
})).map(transform);

class Plugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    const {
      attributes = {},
      pathPrefix: prefix = '',
      transform = (tag) => tag,
      replacePublicPath: replace = false,
    } = this.options;

    if (HtmlWebpackPlugin.getHooks) {
      // HtmlWebpackPlugin version 4.0.0-beta.5
      compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
        const { publicPath } = compilation.outputOptions;
        HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
          PLUGIN_NAME,
          (data, callback) => {
            data.headTags = updateTags({
              tags: data.headTags, prefix, publicPath, replace, attributes, transform,
            });
            data.bodyTags = updateTags({
              tags: data.bodyTags, prefix, publicPath, replace, attributes, transform,
            });
            callback(null, data);
          },
        );
      });
    } else {
      // HtmlWebpackPlugin version 3.2.0
      compiler.plugin('compilation', (compilation) => {
        const { publicPath } = compilation.outputOptions;
        compilation.plugin('html-webpack-plugin-alter-asset-tags', (data) => {
          data.head = updateTags({
            tags: data.head, prefix, publicPath, replace, attributes, transform,
          });
          data.body = updateTags({
            tags: data.body, prefix, publicPath, replace, attributes, transform,
          });
        });
      });
    }
  }
}

module.exports = Plugin;
