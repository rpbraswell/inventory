class HomePageModel {
    constructor(page, config) {
        this.page = page;
        this.config = config;
    }
    async go() {
        return await this.page.goto(this.config.baseURL)
    }
    async title() {
        return await this.page.title();
    }
    async navButtons() {
        return await this.page.$$('nav button')
    }
}


module.exports = HomePageModel;