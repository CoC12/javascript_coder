class Question {
    /**
     * コンストラクタ
     * @param {string} id 問題ID
     * @param {string} title 問題タイトル
     * @param {Array<string>} textList 問題文のリスト（それぞれ<p>タグで囲われる）
     * @param {Array<string>} limitationList 制約のリスト（それぞれ<li>タグで囲われる）
     * @param {string} html 問題のHTML
     * @param {string} editorDefault エディタの初期値
     */
    constructor(
        id,
        title,
        textList,
        limitationList,
        html,
        editorDefault,
    ) {
        this.id = id;
        this.title = title;
        this.textList = textList;
        this.limitationList = limitationList;
        this.html = html;
        this.editorDefault = editorDefault;
    }

    /**
     * JSON オブジェクトから Question オブジェクトを生成する。
     * @param {JSON} json JSON オブジェクト
     * @return {Question} Question オブジェクト
     */
    static fromJson(json) {
        return new Question(
            json.id,
            json.title,
            json.textList,
            json.limitationList,
            json.html,
            json.editorDefault,
        );
    }
}
