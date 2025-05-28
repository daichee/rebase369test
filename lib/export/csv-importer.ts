export class CSVImporter {
  /**
   * CSVファイルを読み込み、部屋データとして変換
   */
  static async importRooms(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string
          const lines = csv.split('\n')
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
          
          const data = []
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue
            
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
            const room: any = {}
            
            headers.forEach((header, index) => {
              switch (header) {
                case '部屋名':
                  room.name = values[index]
                  break
                case 'フロア':
                  room.floor = values[index]
                  break
                case '定員':
                  room.capacity = parseInt(values[index]) || 0
                  break
                case '基本料金':
                  room.basePrice = parseInt(values[index]) || 0
                  break
                case '部屋タイプ':
                  room.type = values[index]
                  break
                case '設備':
                  room.amenities = values[index] ? values[index].split('、') : []
                  break
                case '説明':
                  room.description = values[index]
                  break
                case 'ステータス':
                  room.isActive = values[index] === 'アクティブ' || values[index] === 'true'
                  break
              }
            })
            
            if (room.name) {
              room.id = Math.random().toString(36).substr(2, 9)
              room.createdAt = new Date().toISOString()
              room.updatedAt = new Date().toISOString()
              data.push(room)
            }
          }
          
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
      reader.readAsText(file, 'UTF-8')
    })
  }

  /**
   * CSVファイルを読み込み、オプションデータとして変換
   */
  static async importOptions(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string
          const lines = csv.split('\n')
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
          
          const data = []
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue
            
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
            const option: any = {
              pricing: {
                adult: 0,
                student: 0,
                child: 0,
                preschool: 0,
                infant: 0,
              },
              dayMultipliers: {
                weekday: 1.0,
                weekend: 1.0,
              },
            }
            
            headers.forEach((header, index) => {
              switch (header) {
                case 'オプション名':
                  option.name = values[index]
                  break
                case 'カテゴリ':
                  option.category = values[index]
                  break
                case '説明':
                  option.description = values[index]
                  break
                case '大人料金':
                  option.pricing.adult = parseInt(values[index]) || 0
                  break
                case '学生料金':
                  option.pricing.student = parseInt(values[index]) || 0
                  break
                case '小学生料金':
                  option.pricing.child = parseInt(values[index]) || 0
                  break
                case '未就学児料金':
                  option.pricing.preschool = parseInt(values[index]) || 0
                  break
                case '乳幼児料金':
                  option.pricing.infant = parseInt(values[index]) || 0
                  break
                case '平日倍率':
                  option.dayMultipliers.weekday = parseFloat(values[index]) || 1.0
                  break
                case '休日倍率':
                  option.dayMultipliers.weekend = parseFloat(values[index]) || 1.0
                  break
                case 'ステータス':
                  option.isActive = values[index] === 'アクティブ' || values[index] === 'true'
                  break
              }
            })
            
            if (option.name) {
              option.id = Math.random().toString(36).substr(2, 9)
              option.createdAt = new Date().toISOString()
              option.updatedAt = new Date().toISOString()
              data.push(option)
            }
          }
          
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
      reader.readAsText(file, 'UTF-8')
    })
  }

  /**
   * CSVテンプレートファイルをダウンロード
   */
  static downloadRoomTemplate(): void {
    const headers = [
      "部屋名",
      "フロア", 
      "定員",
      "基本料金",
      "部屋タイプ",
      "設備",
      "説明",
      "ステータス"
    ]
    
    const sampleData = [
      [
        "1年1組",
        "2F",
        "5",
        "7000",
        "個室",
        "WiFi、エアコン、テレビ",
        "少人数向けの個室",
        "アクティブ"
      ]
    ]
    
    const csvContent = [headers, ...sampleData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")
    
    this.downloadCSV(csvContent, "部屋データテンプレート.csv")
  }

  /**
   * オプションCSVテンプレートファイルをダウンロード
   */
  static downloadOptionTemplate(): void {
    const headers = [
      "オプション名",
      "カテゴリ",
      "説明",
      "大人料金",
      "学生料金", 
      "小学生料金",
      "未就学児料金",
      "乳幼児料金",
      "平日倍率",
      "休日倍率",
      "ステータス"
    ]
    
    const sampleData = [
      [
        "朝食",
        "meal",
        "和定食または洋定食",
        "700",
        "700",
        "700", 
        "700",
        "0",
        "1.0",
        "1.0",
        "アクティブ"
      ]
    ]
    
    const csvContent = [headers, ...sampleData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")
    
    this.downloadCSV(csvContent, "オプションデータテンプレート.csv")
  }

  /**
   * CSVファイルダウンロード（内部メソッド）
   */
  private static downloadCSV(content: string, filename: string): void {
    const BOM = "\uFEFF" // UTF-8 BOM for Excel compatibility
    const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}