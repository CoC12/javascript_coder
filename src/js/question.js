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
     * @param {Array<Step>} steps テストケース処理のリスト
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
            json.steps.map(step => stepFactory(step)),
        );
    }

    /**
     * 定義されたテストケース処理を実行し結果を返す。
     * @param {Document} targetDocument テスト対象のDocument
     * @param {boolean} debug デバッグモードが有効かどうか
     * @returns {boolean} テスト実行結果
     */
    isAccepted(targetDocument, debug = false) {
        let result = true;
        try {
            this.steps.forEach((step) => step.execute(targetDocument));
        } catch (e) {
            if (debug) {
                console.error(`ID: ${this.id}, name: ${this.name}\n`, e);
            }
            result = false;
        }
        return result;
    }
}


class BaseStep {
    /**
     * コンストラクタ
     * @param {string} type 種別
     * @param {string} selector セレクタ
     * @param {number} repeat 繰り返し回数
     * @param {object} options オプション値
     */
    constructor(
        type,
        selector,
        repeat,
        options,
    ) {
        this.type = type;
        this.selector = selector;
        this.repeat = repeat;
        this.options = options;
    }

    /**
     * ステップを実行する。
     * @param {Document} targetDocument テスト対象のDocument
     */
    execute(targetDocument) {
        for (let i = 0; i < this.repeat; i++) {
            const element = targetDocument.querySelector(this.selector);
            this._execute(element);
        }
    }

    /**
     * ステップを実行する。
     * （中身は、子クラスで実装）
     * @param {Element} targetElement 処理対象の要素
     */
    _execute(targetElement) {
        throw new Error('Not implemented');
    }
}


class ClickStep extends BaseStep {
    /**
     * ステップを実行する。
     * @param {Element} targetElement 処理対象の要素
     */
    _execute(targetElement) {
        targetElement.click();
    }
}


class InputStep extends BaseStep {
    /**
     * ステップを実行する。
     * @param {Element} targetElement 処理対象の要素
     */
    _execute(targetElement) {
        targetElement.value = this.options.value;
    }
}


class AssertStep extends BaseStep {
    /**
     * ステップを実行する。
     * @param {Element} targetElement 処理対象の要素
     */
    _execute(targetElement) {
        const expectedValue = this.options.value;
        if (targetElement.textContent !== expectedValue) {
            throw new Error(`Assertion failed: ${targetElement.textContent} !== ${expectedValue}`);
        }
    }
}


class AssertAttributeStep extends BaseStep {
    /**
     * ステップを実行する。
     * @param {Element} targetElement 処理対象の要素
     */
    _execute(targetElement) {
        const attribute = this.options.attribute;
        const expectedValue = this.options.value;
        if (targetElement[attribute] !== expectedValue) {
            throw new Error(`Assertion failed: ${targetElement[attribute]} !== ${expectedValue}`);
        }
    }
}


const stepTypes = {
    input: InputStep,
    click: ClickStep,
    assert: AssertStep,
    assertAttribute: AssertAttributeStep,
};


/**
 * JSON オブジェクトから Step オブジェクトを生成する。
 * @param {JSON} json JSON オブジェクト
 * @return {BaseStep} Step オブジェクト
 */
const stepFactory = (json) => {
    const type = json.type;
    const selector = json.selector;
    const repeat = json.repeat || 1;
    const options = json;
    return new stepTypes[type](type, selector, repeat, options);
};
