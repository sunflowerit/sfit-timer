(function (exports) {
  // Helper functions

  const { xml } = owl;

  // Check if duplicate records exist
  function checkDupRemotes(new_remote, remotes) {
    for (let remote of remotes) {
      let rem = JSON.parse(remote);
      if (rem.host === new_remote.host && rem.database === new_remote.database)
        return true;
    }
    return false;
  }

  /**
 * Escapes a string to use as a RegExp.
 * @url https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
 *
 * @param {string} str
 * @returns {string} escaped string to use as a RegExp
 */

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

  // Check if URL is valid
  function validURL(str) {
    var pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol (http or https, both optional)
        "(" +
        "(localhost)|" + // match localhost
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}))" + // OR domain name
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    return !!pattern.test(str);
  }

  /**
 * @template T1, T2
 * @param {T1[]} array1
 * @param {T2[]} array2
 * @param {boolean} [fill=false]
 * @returns {[T1, T2][]}
 */
function zip(array1, array2, fill = false) {
  const result = [];
  const getLength = fill ? Math.max : Math.min;
  for (let i = 0; i < getLength(array1.length, array2.length); i++) {
      result.push([array1[i], array2[i]]);
  }
  return result;
}

function parseParams(matches, paramSpecs) {
  return Object.fromEntries(
      zip(matches, paramSpecs).map(([match, paramSpec]) => {
          const { type, name } = paramSpec;
          switch (type) {
              case "int":
                  return [name, parseInt(match)];
              case "string":
                  return [name, match];
              default:
                  throw new Error(`Unknown type ${type}`);
          }
      })
  );
}

  /*
   * Load xml templates
   * @param {string} PATH /path/to/template.xml
   * return {string} xml template code
   */

  function get_template(PATH) {
    var xhr;
    var file = browser.runtime.getURL(PATH);
    xhr = new XMLHttpRequest();
    xhr.open("GET", file, false);
    xhr.onreadystatechange = function () {
      // Set the callback
      var response = xhr.response;
      if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
        console.log(`SUCCESS: Template loaded!`);
      } else {
        console.log(`ERROR: Template file not loaded => ${response}`);
      }
    };
    xhr.send();
    return xml`${xhr.responseText}`;
  }


  exports.get_template = get_template;
  exports.validURL = validURL;
  exports.checkDupRemotes = checkDupRemotes;
  exports.zip = zip;
  exports.parseParams = parseParams;
  exports.escapeRegExp = escapeRegExp;

})((this.HelperFuncs = this.HelperFuncs || {}));
