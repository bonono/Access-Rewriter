
global = @

class config 

   _create_id: ( ) ->
      id = Math.floor ( Math.random( ) * 1000000 )
      while @_get_rewrite( id ) isnt null
         id = Math.floor ( Math.random( ) * 1000000 )
      id

   _get_rewrite: ( id ) -> 
      if ( index = @_get_rewrite_index id ) isnt -1 then return @_config.rewrite[ index ] else null
      
   _get_rewrite_index: ( id ) ->
      for rewrite, i in @_config.rewrite
         return i if rewrite.id is id
      -1

   _write_config: ( callback ) ->
      chrome.storage.local.set
         version  : @_version
         app      : @_config
      , ( ) => callback.call @, not chrome.runtime.lastError?

   _read_data: ( callback ) ->
      if @_config.rewrite.length is 0
         callback.call @, true
      else
         id_array = ( rewrite.id for rewrite in @_config.rewrite )
         id       = id_array.shift( )
         property = "data_#{id}"
         chrome.storage.local.get property, ( data ) =>
            if chrome.runtime.lastError?
               callback.call @, false
            else
               @_data[ property ] = data[ property ]
               if ( id = id_array.shift( ) )?
                  property = "data_#{id}"
                  chrome.storage.local.get property, arguments.callee
               else
                  callback.call @, true

   constructor: ( callback ) ->

      @_version   = chrome.runtime.getManifest( ).version
      @_data      = { }
      @_config    = 
         disabled_all   : false
         rewrite        : [ ]

      chrome.storage.local.get [ "version", "app" ], ( saved ) =>
         if chrome.runtime.lastError?
            callback.call @, false
         else 
            if not saved.version?
               @_write_config callback
            else if saved.version isnt @_version
               # バージョン情報が現在のバージョンと違う場合の処理をここに書く
               # 現在無し
            else
               @_config = saved.app
               @_read_data callback
               
   # データを除いた設定を返す
   get_rewrite: ( id ) -> @_get_rewrite id
   get_rewrites: ( ) -> @_config.rewrite

   get_data: ( id ) ->
      if @_data[ "data_#{id}" ]?
         @_data[ "data_#{id}" ]
      else
         null

   add: ( title, url, url_is_regex, mime_header, mime_body, base64, data, callback ) ->

      valid_mime = /^[a-zA-Z\.\-]+$/
      if not mime_header.match valid_mime or not mime_body.match valid_mime
         callback.call @, false, null

      id = @_create_id( )
      @_config.rewrite.push
         id          : id
         title       : title
         url         : url
         url_is_regex: url_is_regex
         mime_header : mime_header,
         mime_body   : mime_body
         base64      : base64
         disabled    : false

      set_data = app: @_config
      set_data[ "data_#{id}" ] = data # データは個別のプロパティへ格納する

      chrome.storage.local.set set_data, ( ) =>
         if chrome.runtime.lastError?
            @_config.rewrite.pop( )
            callback.call @, false, null
         else
            @_data[ "data_#{id}" ] = data
            callback.call @, true, @_config.rewrite[ @_config.rewrite.length - 1 ]

   remove: ( id, callback ) ->
      callback.call @, false, null if ( index = @_get_rewrite_index id ) is -1

      removed = @_config.rewrite[ index ]
      @_config.rewrite.splice index, 1

      chrome.storage.local.set app: @_config, ( ) =>
         if chrome.runtime.lastError?
            @_config.rewrite.splice index, 0, removed
            callback.call @, false, null
         else
            # データに関してはエラーチェックをしない
            # なので失敗した場合は"迷子のデータ"が発生する
            # 迷子のデータを削除する機能が必要になるかも
            chrome.storage.local.remove "data_#{removed.id}", ( ) =>
               @_data[ "data_#{removed.id}" ] = undefined
               callback.call @, true, removed

   override: ( id, title, url, url_is_regex, mime_header, mime_body, base64, data, callback ) ->
      callback.call @, false, null if ( index = @_get_rewrite_index parseInt ( id ) ) is -1
    
      backup = @_config.rewrite[ index ]
      @_config.rewrite[ index ] =
         id          : backup.id
         title       : title
         url         : url
         url_is_regex: url_is_regex
         mime_header : mime_header
         mime_body   : mime_body
         base64      : base64
         disabled    : backup.disabled

      set_data = app: @_config
      set_data[ "data_#{backup.id}" ] = data

      chrome.storage.local.set set_data, ( ) =>
         if chrome.runtime.lastError?
            @_config.rewrite[ index ] = backup
            callback.call @, false, null
         else
            @_data[ "data_#{backup.id}" ] = data
            callback.call @, true, @_config.rewrite[ index ]

   disabled_all: ( ) -> @_config.disabled_all
   set_disabled_all: ( boolean, callback ) ->
      @_config.disabled_all = boolean
      chrome.storage.local.set app: @_config, ( ) =>
         if chrome.runtime.lastError?
            callback.call @, false
         else
            callback.call @, true

   disabled: ( id, boolean, callback ) ->
      if ( index = @_get_rewrite_index id ) is null then callback.call @, false, null
      backup = @_config.rewrite[ index ].disabled
      @_config.rewrite[ index ].disabled = boolean
      chrome.storage.local.set app: @_config, ( ) =>
         if chrome.runtime.lastError?
            @_config.rewrite[ index ].disabled = backup
            callback.call @, false, @_config.rewrite[ index ]
         else
            callback.call @, true, @_config.rewrite[ index ]

global.config = config














      