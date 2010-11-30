<?php
switch ($_GET['s']) {
  case 'vimeo':
    $url = 'http://vimeo.com/api/clip/'.$_GET['id'].'/php';
    $contents = @file_get_contents($url);
    $thumb = @unserialize(trim($contents));
    header('Location: '.$thumb[0][thumbnail_medium]);
    break;
  case 'googlevideo':
    $url = 'http://video.google.com/videofeed?docid='.$_GET['id'];
    $contents = @file_get_contents($url);
    $thumb = array();
    preg_match("/media:thumbnail url=\"([^\"]\S*)\"/siU", $contents ,$thumb);
    header('Location: '.html_entity_decode($thumb[1]));
    break;
}
?>