import {ipcRenderer} from 'electron'

export async function getFilePath(subUrl, code) {
  const verify = JSON.parse(await (await fetch(`https://pan.baidu.com/share/verify?surl=${subUrl}&channel=chunlei&web=1&app_id=250528&clienttype=0&pwd=${code}`, {
    method: "POST",
    body: `pwd=${code}&vcode=&vcode_str=`,
    mode: 'no-cors',
    credentials: 'omit',
    headers: {
      'User-Agent': 'netdisk',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cookie': ''
    },
  })).text())

  if (verify.errno === 0) {
    const randsk = verify.randsk
    ipcRenderer.send('command', 'session:set-cookie', 'https://pan.baidu.com', 'BDCLND', randsk)
    if (randsk !== 1) {
      const file = await (await fetch(`https://pan.baidu.com/s/1${subUrl}`, {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'include',
        headers: {
          'User-Agent': 'netdisk',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
      })).text()

      let json = file.match(/yunData.setData\((\{.*?\})\);/)[1]
      json = JSON.parse(json)
      json['randsk'] = randsk
      return json;
    }
  }

  return {
    code: 1,
    msg: '提取码失败或文件不存在！'
  }
}

export async function getDir(shareId,uk, path) {
  const file = await (await fetch(`https://pan.baidu.com/share/list?uk=${uk}&shareid=${shareId}&order=other&desc=1&showempty=0&web=1&page=1&num=100&dir=${encodeURIComponent(path)}&channel=chunlei&web=1&app_id=250528&clienttype=0`, {
    method: 'GET',
    mode: 'no-cors',
    credentials: 'include',
  })).text()

  let json = JSON.parse(file);
  if (json.errno !== 0)  {
    return {
      code: 1,
      msg: '提取码失败或文件不存在！'
    }
  }
  return json.list;
}

// export async function getDownloadUrl({fs_id, timestamp, sign, randsk, share_id, uk, }) {
//   const BDS_TOKEN = 'e495f48867cd0e956778d97634490e4d'
//
//   let extra = encodeURIComponent(`{"sekey": "${randsk}"}`);
//   let res = JSON.parse(await (await fetch(`https://pan.baidu.com/api/sharedownload?app_id=250528&channel=chunlei&clienttype=0&sign=${sign}&timestamp=${timestamp}&web=1&bdstoken=${randsk}`, {
//     method: "POST",
//     mode: 'no-cors',
//     body: `encrypt=0&extra=${extra}=&fid_list=[${fs_id}]&primaryid=${share_id}&uk=${uk}&product=share&type=nolimit`,
//     credentials: 'include',
//   })).text())
//
//   if (res.errno === -20) {
//     return getVerify(BDS_TOKEN)
//   }
//
//   return res
// }
//
//
//
// export async function getVerify(bdsToken) {
//   return JSON.parse(await ((await fetch(`https://pan.baidu.com/api/getvcode?prod=pan&channel=chunlei&web=1&app_id=250528&bdstoken=${bdsToken}&clienttype=0`, {
//       method: "GET",
//       mode: 'no-cors',
//       credentials: 'include',
//     })).text()
//   ))
// }

export async function getDownloadAddress({fs_id, timestamp, sign, randsk, share_id, uk, share, pwd}) {
  return (await (await fetch(`https://pan.kdbaidu.com/?download`, {
    method: "POST",
    mode: 'no-cors',
    body: `fs_id=${fs_id}&timestamp=${timestamp}&sign=${sign}&randsk=${randsk}&share_id=${share_id}&uk=${uk}&share=${share}&pwd=${pwd}`,
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
  })).text()).match(/(https)(.+?)(CookieBDUSS)/)[0]
}
