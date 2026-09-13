# Audio Impedance Lab

ギターとオーディオ配線の回路定数を動かし、機材・等価回路・電気的伝達特性の対応を確認できる、ブラウザだけで動く教材です。

## デモ

GitHub Pagesを有効にすると、次の形式のURLで公開できます。

`https://<your-name>.github.io/<repository-name>/`

## 主な機能

- Pickup DCR/L/自己容量/共振減衰、Volume/Toneの部品値とノブ位置、ケーブル、Amp入力を変更
- Source Rout、ケーブル長と単位長R/L/C、Load Rinを変更
- 低容量・標準・Canare GS-6容量参考のケーブルプリセット
- ケーブルLの増減に連動するコイル記号（大小を示す教材用表示）
- 「ロー出し・ハイ受け」「ハイ出し・ロー受け」「ギター直結」の比較
- アイコン付きの信号経路と、値が連動する等価回路
- 初期値との比較曲線、スマートフォン表示、ライト／ダーク配色

## 回路モデル

### ギター

ピックアップ内部起電力に直列の `Rp + jωLp` を置き、そのホット側に自己容量 `Cp` と共振の減衰をまとめて表す等価抵抗 `Rdamp(eq)` を並列接続しています。そこから先は次の構成です。

- Tone: 可変抵抗とコンデンサの直列枝
- Volume: 上側抵抗と下側抵抗に分割した3端子ポット。ワイパーが出力
- Cable: `長さ × 単位長容量` の対地容量
- Amp: 入力ジャックの `Rin` と、`grid stopper + Cin` の枝

表示する伝達特性は `Vgrid / pickup内部EMF` です。Volume/Toneのノブは10%オーディオテーパー相当で近似しています。`Cin` は真空管単体の端子間容量ではなく、Miller効果を含む実効入力容量として扱います。

`Stratタイプ`とは、Fender Stratocaster系で一般的なシングルコイルPickupと250 kΩのVolume/Toneを想定した呼び方です。この教材では3個のPickupや5ウェイスイッチ全体ではなく、Pickupを1個だけ選択した状態を計算します。

### 接続とケーブル

ケーブル長と単位長定数から合計R/L/Cを求め、`Source Rout + Cable R + jωL` と、`Load Rin || 1/(jωC)` の分圧として計算しています。音声帯域の短いケーブルを集中定数で近似したもので、長い伝送線路の反射や遅延は扱いません。

回路図のコイル記号のループ数は、ケーブルの合計Lが増えるほど多くなる教材用表示です。実際のケーブル内部が表示どおりに巻かれている、またはループ数からLが直接決まる、という意味ではありません。

## 初期値の根拠

プリセットは「実製品の公称値」と「説明用の仮定」を区別しています。

- `Stratタイプ（例示）` と `PAFタイプ（例示）` は代表的な範囲から選んだ教材用の値で、特定製品の再現ではありません。
- `Fender ’57/’62` は DCR 5.4 kΩ、インダクタンス 2.1 Hのみメーカー公称値です。自己容量、損失抵抗、ポット、ケーブル、アンプ条件は例示です。
- Pickup自己容量 100 pF、損失抵抗 1 MΩ、アンプ実効入力容量 100 pFは調整可能な初期仮定です。個体・配線・回路で変わります。

## このモデルに含まれないもの

弦・ボディ・ピッキング位置による原信号のスペクトル、複数ピックアップ間の相互作用、ボリュームのtreble bleed、Tone配線方式の違い、真空管の非線形、パワーアンプ、スピーカー、マイク／室内音響は含みません。そのためグラフは総合的なギター音の周波数特性ではなく、受動回路と入力負荷の電気的伝達特性です。

## 参考資料

- [Arena Physica: Smith Charts](https://www.arenaphysica.com/publications/smith-charts)
- [Fender Pure Vintage '57/'62 Stratocaster Pickups](https://www.fender.com/en-US/parts/stratocaster-parts/pure-vintage-5762-stratocaster-pickup-set/0992117000.html)
- Manfred Zollner, *Acoustics and Modeling of Pickups*, AES 140th Convention

## License

MIT License
