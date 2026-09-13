# Audio Impedance Lab

ギターとオーディオ配線の回路定数を動かし、機材・等価回路・周波数特性の対応を確認できる、ブラウザだけで動く教材です。

## デモ

GitHub Pagesを有効にすると、次の形式のURLで公開できます。

`https://<your-name>.github.io/<repository-name>/`

## 主な機能

- エレキギターの等価回路：Pickup DCR/L、Volume、Tone、Cable C、Amp入力を変更
- 接続モデル：Source Rout、Cable R/L/C、Load Rinを変更
- 「ロー出し・ハイ受け」「ハイ出し・ロー受け」「ギター直結」の比較
- アイコン付きの信号経路と等価回路を並べて表示
- 初期値との比較曲線、スマートフォン表示、ライト／ダーク配色

## 回路モデル

### ギター

ピックアップを電圧源と直列の `Rp + jωLp` とし、その先のノードに以下を並列接続しています。

- Volume pot
- `Tone pot + 1/(jωCtone)`
- Cable capacitance
- `Amp series resistor + (Amp Rin || Amp Cin)`

表示電圧はアンプ入力抵抗・容量の端子電圧です。Volumeは最大位置として、ポット全体を対地抵抗に近似しています。

### 接続とケーブル

`Source Rout + Cable R + jωL` と、`Load Rin || 1/(jωC)` の分圧として計算しています。音声帯域の短いケーブルを集中定数で近似したもので、長い伝送線路の反射や遅延は扱いません。

## 初期値の根拠

添付資料の例を基準に、Stratocaster例は Pickup DCR 5 kΩ、L 3 H、Volume/Tone 250 kΩ、Tone C 47 nF、Cable C 500 pF、Amp Rin 1 MΩ、Amp series R 34 kΩ としました。Amp input Cは、真空管段の詳細モデルの代わりとなる調整可能な入力容量です。

## ローカル実行

外部ライブラリやビルドは不要です。`index.html` を開くだけでも動作します。ローカルサーバーを使う場合：

```bash
python -m http.server 8000
```

その後、`http://localhost:8000` を開きます。

## GitHub Pagesで公開

1. このフォルダの内容をGitHubリポジトリのルートへpush
2. GitHubの `Settings` → `Pages`
3. `Build and deployment` のSourceを `Deploy from a branch` に設定
4. Branchを `main`、folderを `/(root)` にして保存

## 注意

これは定数変更の傾向を比較する教育用モデルです。実機のピックアップ、ケーブル、アンプは周波数依存損失、寄生成分、非線形性、製造ばらつきを含むため、測定結果と完全には一致しません。

## 参考

- [Arena Physica — Smith Charts](https://www.arenaphysica.com/publications/smith-charts)

## License

MIT License
