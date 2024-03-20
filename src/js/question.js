class Question {
    /**
     * コンストラクタ
     * @param {string} id 問題ID
     * @param {string} title 問題タイトル
     * @param {Array<string>} textList 問題文のリスト（それぞれ<p>タグで囲われる）
     * @param {Array<string>} limitationList 制約のリスト（それぞれ<li>タグで囲われる）
     * @param {string} html 問題のHTML
     * @param {string} editorDefault エディタの初期値
     * @param {Array<TestCase>} testCases TestCase オブジェクトのリスト
     */
    constructor(
        id,
        title,
        textList,
        limitationList,
        html,
        editorDefault,
        testCases,
    ) {
        this.id = id;
        this.title = title;
        this.textList = textList;
        this.limitationList = limitationList;
        this.html = html;
        this.editorDefault = editorDefault;
        this.testCases = testCases;
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
            json.testCases.map(testCase => TestCase.fromJson(testCase)),
        );
    }
}


class TestCase {
    /**
     * コンストラクタ
     * @param {string} id テストケースID
     * @param {string} name テストケース名
     * @param {string} description テストケース説明
     * @param {Array<object>} steps テストケース処理のリスト
     */
    constructor(
        id,
        name,
        description,
        steps,
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.steps = steps;
    }

    /**
     * JSON オブジェクトから TestCase オブジェクトを生成する。
     * @param {JSON} json JSON オブジェクト
     * @return {TestCase} TestCase オブジェクト
     */
    static fromJson(json) {
        return new TestCase(
            json.id,
            json.name,
            json.description,
            json.steps,
        );
    }

    /**
     * 定義されたテストケース処理を実行し結果を返す。
     * @param {Document} targetDocument テスト対象のDocument
     * @returns {boolean} テスト実行結果
     */
    isAccepted(targetDocument) {
        let result = true;
        try {
            this.steps.forEach((step) => {
                const element = targetDocument.querySelector(step.selector);
                switch (step.type) {
                    case 'input':
                        element.value = step.value;
                        break;
                    case 'click':
                        element.click();
                        break;
                    case 'assert':
                        if (element.textContent !== step.value) {
                            throw new Error(`Assertion failed: ${element.textContent} !== ${step.value}`);
                        }
                        break;
                    default:
                        throw new Error(`Unknown step type: ${step.type}`);
                }
            });
        } catch {
            result = false;
        }
        return result;
    }
}
