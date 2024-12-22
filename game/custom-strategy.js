const Strategy = require("passport-strategy");
const axios = require("axios");

class OAuth2Strategy extends Strategy {
  constructor(options, verify) {
    super();

    this.name = "oauth2-strategy";
    this.verify = verify;
    this.auth_uri = options.auth_uri;
    this.token_uri = options.token_uri;
    this.userinfo_uri = options.userinfo_uri;
    this.client_id = options.client_id;
    this.client_secret = options.client_secret;
    this.redirect_uri = options.redirect_uri;
  }

  authenticate(req, options) {
    if (req.query && req.query.code) {
      const code = req.query.code;

      // Exchange
      const params = new URLSearchParams();
      params.append("code", code);
      params.append("redirect_uri", this.redirect_uri);
      params.append("client_id", this.client_id);
      params.append("client_secret", this.client_secret);

      axios
        .post(this.token_uri, params)
        .then((response) => {
          const accessToken = response.data.access_token;

          this.fetchProfile(accessToken, (err, profile) => {
            if (err) return this.error(err);
            this.verify(accessToken, profile, (err, user, info) => {
              if (err) return this.error(err);
              this.success(user, info);
            });
          });
        })
        .catch((error) => {
          this.error(error);
        });
    }
  }

  fetchProfile(accessToken, callback) {
    axios
      .get(this.userinfo_uri, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        const profile = response.data;
        callback(null, profile);
      })
      .catch((error) => {
        callback(error);
      });
  }
}
export default OAuth2Strategy;
